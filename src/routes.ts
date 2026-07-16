import type { AppRecord } from './types.js';

function objectValue(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? value as Record<string, unknown>
        : {};
}

function text(value: unknown, maximum = 1_000): string | null {
    if (typeof value !== 'string') return null;
    const normalized = value.replace(/\s+/g, ' ').trim();
    return normalized ? normalized.slice(0, maximum) : null;
}

function numberValue(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

function integerValue(value: unknown): number | null {
    const number = numberValue(value);
    return number !== null && Number.isSafeInteger(number) ? number : null;
}

function numericIdValue(value: unknown): string | null {
    if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return String(value);
    if (typeof value === 'string' && /^[1-9]\d{0,19}$/.test(value.trim())) return value.trim();
    return null;
}

function appIdValue(value: unknown): string | null {
    const id = numericIdValue(value);
    return id && /^[1-9]\d{5,19}$/.test(id) ? id : null;
}

function textArray(value: unknown, maximumItems = 50): string[] {
    if (!Array.isArray(value)) return [];
    return [...new Set(value
        .map((item) => text(item, 300))
        .filter((item): item is string => item !== null))].slice(0, maximumItems);
}

function idArray(value: unknown, maximumItems = 50): string[] {
    if (!Array.isArray(value)) return [];
    return [...new Set(value
        .map(numericIdValue)
        .filter((item): item is string => item !== null))].slice(0, maximumItems);
}

function isoTimestamp(value: unknown): string | null {
    if (typeof value !== 'string' || !value.trim()) return null;
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

export function rawAppId(value: unknown): string | null {
    return appIdValue(objectValue(value).trackId);
}

export function mapApp(value: unknown, country: string): AppRecord {
    const app = objectValue(value);
    const price = numberValue(app.price);
    return {
        source: 'apple_app_store',
        recordType: 'app',
        appId: appIdValue(app.trackId) ?? '',
        appName: text(app.trackName, 300) ?? '',
        bundleId: text(app.bundleId, 300) ?? '',
        developer: text(app.sellerName ?? app.artistName, 300) ?? '',
        developerId: numericIdValue(app.artistId),
        primaryGenre: text(app.primaryGenreName, 300),
        primaryGenreId: numericIdValue(app.primaryGenreId),
        genres: textArray(app.genres),
        genreIds: idArray(app.genreIds),
        price,
        priceText: text(app.formattedPrice, 100),
        currency: text(app.currency, 20)?.toUpperCase() ?? null,
        isFree: price === null ? null : price === 0,
        rating: numberValue(app.averageUserRating),
        ratingCount: integerValue(app.userRatingCount),
        ratingCurrentVersion: numberValue(app.averageUserRatingForCurrentVersion),
        ratingCountCurrentVersion: integerValue(app.userRatingCountForCurrentVersion),
        contentRating: text(app.contentAdvisoryRating ?? app.trackContentRating, 100),
        version: text(app.version, 100),
        minimumOsVersion: text(app.minimumOsVersion, 100),
        fileSizeBytes: integerValue(app.fileSizeBytes),
        releaseDate: isoTimestamp(app.releaseDate),
        currentVersionReleaseDate: isoTimestamp(app.currentVersionReleaseDate),
        appStoreUrl: text(app.trackViewUrl, 2_000) ?? '',
        country,
        scrapedAt: new Date().toISOString(),
    };
}
