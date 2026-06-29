import { Actor, log } from 'apify';
import type { HttpCrawlingContext } from 'crawlee';
import type { AppRecord } from './types.js';

const num = (v: unknown): number | null => {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() !== '') {
        const n = parseFloat(v);
        return Number.isFinite(n) ? n : null;
    }
    return null;
};

function parseBody(ctx: HttpCrawlingContext): any {
    const anyCtx = ctx as any;
    if (anyCtx.json !== undefined && anyCtx.json !== null) return anyCtx.json;
    const raw = ctx.body?.toString?.() ?? '';
    const t = raw.trim();
    if (!t.startsWith('{') && !t.startsWith('[')) throw new Error('Non-JSON response (blocked/rate-limited). Rotating session.');
    return JSON.parse(t);
}

function mapApp(a: any, country: string): AppRecord {
    return {
        appId: num(a.trackId),
        appName: a.trackName ?? null,
        bundleId: a.bundleId ?? null,
        developer: a.sellerName ?? a.artistName ?? null,
        developerId: num(a.artistId),
        developerUrl: a.artistViewUrl ?? null,
        price: num(a.price),
        formattedPrice: a.formattedPrice ?? null,
        currency: a.currency ?? null,
        rating: num(a.averageUserRating),
        ratingCount: num(a.userRatingCount),
        ratingCurrentVersion: num(a.averageUserRatingForCurrentVersion),
        ratingCountCurrentVersion: num(a.userRatingCountForCurrentVersion),
        primaryGenre: a.primaryGenreName ?? null,
        genres: Array.isArray(a.genres) ? a.genres : [],
        contentRating: a.contentAdvisoryRating ?? a.trackContentRating ?? null,
        version: a.version ?? null,
        minimumOsVersion: a.minimumOsVersion ?? null,
        fileSizeBytes: num(a.fileSizeBytes),
        appStoreUrl: a.trackViewUrl ?? null,
        artworkUrl: a.artworkUrl512 ?? a.artworkUrl100 ?? a.artworkUrl60 ?? null,
        screenshotUrls: Array.isArray(a.screenshotUrls) ? a.screenshotUrls : [],
        languages: Array.isArray(a.languageCodesISO2A) ? a.languageCodesISO2A : [],
        description: a.description ?? null,
        releaseDate: a.releaseDate ?? null,
        currentVersionReleaseDate: a.currentVersionReleaseDate ?? null,
        releaseNotes: a.releaseNotes ?? null,
        country,
        scrapedAt: new Date().toISOString(),
    };
}

export function buildRouter(opts: { country: string }) {
    let spendingLimitReached = false;
    let chargedAppCount = 0;
    const seenAppKeys = new Set<string>();

    const appKey = (record: AppRecord): string | null => {
        if (record.appId != null) return `id:${record.appId}`;
        if (record.bundleId) return `bundle:${record.bundleId.toLowerCase()}`;
        if (record.appStoreUrl) return `url:${record.appStoreUrl.toLowerCase()}`;
        return null;
    };

    return async (ctx: HttpCrawlingContext): Promise<void> => {
        const { request, crawler } = ctx;

        if (spendingLimitReached) return;

        const data = parseBody(ctx);
        const source = (request.userData.source as string) ?? 'apple';
        const results: any[] = Array.isArray(data?.results) ? data.results : [];

        // lookup responses include non-software wrappers occasionally; keep app/software entries.
        const apps = results.filter((r) => r && (r.wrapperType === 'software' || r.kind === 'software' || r.trackId));

        let pushed = 0;
        let skippedDuplicates = 0;
        for (const a of apps) {
            if (spendingLimitReached) break;

            const record = mapApp(a, opts.country);
            const key = appKey(record);
            if (key && seenAppKeys.has(key)) {
                skippedDuplicates += 1;
                continue;
            }

            // Push and charge atomically so unpaid apps are never written and
            // billing failures stop the run instead of being ignored.
            const chargeResult = await Actor.pushData(record, 'app-scraped');
            const recordWasSaved = chargeResult.chargedCount > 0 || !chargeResult.eventChargeLimitReached;
            if (recordWasSaved) {
                if (key) seenAppKeys.add(key);
                pushed += 1;
                chargedAppCount += 1;
            }

            if (chargeResult.eventChargeLimitReached) {
                spendingLimitReached = true;
                await Actor.setStatusMessage(`Stopped at the user's spending limit after ${chargedAppCount} apps`);
                log.warning('User spending limit reached; stopping before more App Store requests.');
                await crawler.autoscaledPool?.abort();
                break;
            }
        }
        log.info(`${source}: pushed ${pushed} apps`, { skippedDuplicates });
    };
}
