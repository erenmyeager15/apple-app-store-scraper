import type { AppRecord } from './types.js';

export const APP_RECORD_FIELDS = [
    'source', 'recordType', 'appId', 'appName', 'bundleId', 'developer', 'developerId',
    'primaryGenre', 'primaryGenreId', 'genres', 'genreIds', 'price', 'priceText',
    'currency', 'isFree', 'rating', 'ratingCount', 'ratingCurrentVersion',
    'ratingCountCurrentVersion', 'contentRating', 'version', 'minimumOsVersion',
    'fileSizeBytes', 'releaseDate', 'currentVersionReleaseDate', 'appStoreUrl',
    'country', 'scrapedAt',
] as const;

const APP_ID = /^[1-9]\d{5,19}$/;
const NUMERIC_ID = /^[1-9]\d{0,19}$/;

function optionalText(value: unknown, maximum = 1_000): boolean {
    return value === null || (typeof value === 'string' && value.trim().length > 0 && value.length <= maximum);
}

function optionalNumber(value: unknown, minimum: number, maximum: number, integer = false): boolean {
    return value === null || (typeof value === 'number' && Number.isFinite(value)
        && value >= minimum && value <= maximum && (!integer || Number.isSafeInteger(value)));
}

function stringList(value: unknown): boolean {
    return Array.isArray(value) && value.length <= 50
        && value.every((item) => typeof item === 'string' && item.trim().length > 0 && item.length <= 300);
}

export function validateAppRecord(record: AppRecord, expectedAppId: string): string[] {
    const errors: string[] = [];
    const keys = Object.keys(record);
    const unexpected = keys.filter((key) => !APP_RECORD_FIELDS.includes(key as typeof APP_RECORD_FIELDS[number]));
    const missing = APP_RECORD_FIELDS.filter((key) => !keys.includes(key));
    if (unexpected.length > 0) errors.push(`unexpected field(s): ${unexpected.join(', ')}`);
    if (missing.length > 0) errors.push(`missing field(s): ${missing.join(', ')}`);
    if (record.source !== 'apple_app_store') errors.push('source must be apple_app_store');
    if (record.recordType !== 'app') errors.push('recordType must be app');
    if (!APP_ID.test(record.appId) || record.appId !== expectedAppId) errors.push('appId does not match the request');
    for (const key of ['appName', 'bundleId', 'developer'] as const) {
        if (typeof record[key] !== 'string' || !record[key].trim() || record[key].length > 300) {
            errors.push(`${key} must be non-empty text of at most 300 characters`);
        }
    }
    if (record.developerId !== null && !NUMERIC_ID.test(record.developerId)) errors.push('developerId must be null or numeric text');
    if (!optionalText(record.primaryGenre, 300)) errors.push('primaryGenre must be null or bounded text');
    if (record.primaryGenreId !== null && !NUMERIC_ID.test(record.primaryGenreId)) errors.push('primaryGenreId must be null or numeric text');
    if (!stringList(record.genres)) errors.push('genres must be a bounded string array');
    if (!stringList(record.genreIds) || record.genreIds.some((id) => !NUMERIC_ID.test(id))) {
        errors.push('genreIds must be a bounded numeric-string array');
    }
    if (!optionalNumber(record.price, 0, 1_000_000_000)) errors.push('price must be null or a non-negative number');
    if (!optionalText(record.priceText, 100)) errors.push('priceText must be null or bounded text');
    if (record.currency !== null && !/^[A-Z]{3}$/.test(record.currency)) errors.push('currency must be null or an ISO-style code');
    if (record.isFree !== null && typeof record.isFree !== 'boolean') errors.push('isFree must be null or boolean');
    if (record.price !== null && record.isFree !== (record.price === 0)) errors.push('isFree must match price');
    for (const key of ['rating', 'ratingCurrentVersion'] as const) {
        if (!optionalNumber(record[key], 0, 5)) errors.push(`${key} must be null or between 0 and 5`);
    }
    for (const key of ['ratingCount', 'ratingCountCurrentVersion', 'fileSizeBytes'] as const) {
        if (!optionalNumber(record[key], 0, Number.MAX_SAFE_INTEGER, true)) {
            errors.push(`${key} must be null or a non-negative safe integer`);
        }
    }
    for (const key of ['contentRating', 'version', 'minimumOsVersion'] as const) {
        if (!optionalText(record[key], 100)) errors.push(`${key} must be null or bounded text`);
    }
    for (const key of ['releaseDate', 'currentVersionReleaseDate'] as const) {
        if (record[key] !== null && !Number.isFinite(Date.parse(record[key] as string))) {
            errors.push(`${key} must be null or a timestamp`);
        }
    }
    if (!/^[a-z]{2}$/.test(record.country)) errors.push('country must be a two-letter lowercase code');
    if (!Number.isFinite(Date.parse(record.scrapedAt))) errors.push('scrapedAt must be a timestamp');
    try {
        const url = new URL(record.appStoreUrl);
        const match = url.pathname.match(/(?:^|\/)id(\d{6,20})(?:\/|$)/);
        if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== 'apps.apple.com'
            || match?.[1] !== expectedAppId) {
            errors.push('appStoreUrl must be the matching official Apple App Store URL');
        }
    } catch {
        errors.push('appStoreUrl must be a valid URL');
    }
    return errors;
}
