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
    return async (ctx: HttpCrawlingContext): Promise<void> => {
        const { request } = ctx;
        const data = parseBody(ctx);
        const source = (request.userData.source as string) ?? 'apple';
        const results: any[] = Array.isArray(data?.results) ? data.results : [];

        // lookup responses include non-software wrappers occasionally; keep app/software entries.
        const apps = results.filter((r) => r && (r.wrapperType === 'software' || r.kind === 'software' || r.trackId));

        let pushed = 0;
        for (const a of apps) {
            await Actor.pushData(mapApp(a, opts.country));
            await Actor.charge({ eventName: 'app-scraped' }).catch(() => null);
            pushed++;
        }
        log.info(`${source}: pushed ${pushed} apps`);
    };
}
