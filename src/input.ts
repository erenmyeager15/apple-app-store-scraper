import type { NormalizedInput, ProxyInput } from './types.js';

const INPUT_FIELDS = new Set(['appIds', 'maxResults', 'country', 'proxyConfiguration']);
const PROXY_FIELDS = new Set(['useApifyProxy', 'apifyProxyGroups', 'apifyProxyCountry', 'proxyUrls']);
const APP_ID = /^[1-9]\d{5,19}$/;

function fail(message: string): never {
    throw new Error(`Invalid input: ${message}`);
}

function asObject(value: unknown, label: string): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${label} must be an object.`);
    return value as Record<string, unknown>;
}

function stringArray(value: unknown, label: string, maximumItems: number, maximumLength: number): string[] {
    if (!Array.isArray(value)) fail(`${label} must be an array of strings.`);
    if (value.length === 0) fail(`${label} must contain at least one value.`);
    if (value.length > maximumItems) fail(`${label} accepts at most ${maximumItems} values.`);
    return value.map((item) => {
        if (typeof item !== 'string') fail(`${label} must contain only strings.`);
        const normalized = item.trim();
        if (!normalized) fail(`${label} cannot contain empty values.`);
        if (normalized.length > maximumLength) fail(`${label} values must be at most ${maximumLength} characters.`);
        return normalized;
    });
}

export function normalizeAppId(value: string): string {
    let appId = value.trim();
    if (/^https?:\/\//i.test(appId)) {
        let url: URL;
        try {
            url = new URL(appId);
        } catch {
            return fail(`Invalid Apple App Store URL: ${value}.`);
        }
        if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== 'apps.apple.com') {
            fail('appIds URLs must use an official https://apps.apple.com/.../idAPP_ID URL.');
        }
        const match = url.pathname.match(/(?:^|\/)id(\d{6,20})(?:\/|$)/);
        appId = match?.[1] ?? '';
    }
    if (!APP_ID.test(appId)) fail(`Invalid Apple App Store app ID: ${value}.`);
    return appId;
}

function locale(value: unknown, label: string, fallback: string): string {
    if (value === undefined) return fallback;
    if (typeof value !== 'string' || !/^[A-Za-z]{2}$/.test(value.trim())) {
        fail(`${label} must be a two-letter code.`);
    }
    return value.trim().toLowerCase();
}

function maxResults(value: unknown): number {
    if (value === undefined) return 1;
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 50) {
        fail('maxResults must be an integer between 1 and 50.');
    }
    return value;
}

function normalizeProxy(value: unknown): ProxyInput {
    if (value === undefined) return { useApifyProxy: false };
    const raw = asObject(value, 'proxyConfiguration');
    const unknown = Object.keys(raw).filter((key) => !PROXY_FIELDS.has(key));
    if (unknown.length > 0) fail(`Unsupported proxyConfiguration field(s): ${unknown.join(', ')}.`);
    if (raw.useApifyProxy !== undefined && typeof raw.useApifyProxy !== 'boolean') {
        fail('proxyConfiguration.useApifyProxy must be a boolean.');
    }

    const groups = raw.apifyProxyGroups === undefined
        ? undefined
        : stringArray(raw.apifyProxyGroups, 'proxyConfiguration.apifyProxyGroups', 10, 50)
            .map((group) => group.toUpperCase());
    const proxyUrls = raw.proxyUrls === undefined
        ? undefined
        : stringArray(raw.proxyUrls, 'proxyConfiguration.proxyUrls', 10, 2_000).map((proxyUrl) => {
            let parsed: URL;
            try {
                parsed = new URL(proxyUrl);
            } catch {
                return fail('proxyConfiguration.proxyUrls contains an invalid URL.');
            }
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                fail('proxyConfiguration.proxyUrls accepts only HTTP or HTTPS URLs.');
            }
            return parsed.toString();
        });
    let country: string | undefined;
    if (raw.apifyProxyCountry !== undefined) {
        country = locale(raw.apifyProxyCountry, 'proxyConfiguration.apifyProxyCountry', '').toUpperCase();
    }

    const useApifyProxy = raw.useApifyProxy ?? false;
    if (useApifyProxy && proxyUrls?.length) fail('Use either Apify Proxy or custom proxyUrls, not both.');
    if (!useApifyProxy && (groups?.length || country)) {
        fail('Enable useApifyProxy when setting Apify Proxy groups or country.');
    }
    return {
        useApifyProxy,
        ...(groups?.length ? { apifyProxyGroups: [...new Set(groups)] } : {}),
        ...(country ? { apifyProxyCountry: country } : {}),
        ...(proxyUrls?.length ? { proxyUrls: [...new Set(proxyUrls)] } : {}),
    };
}

export function normalizeInput(value: unknown): NormalizedInput {
    const raw = value === undefined || value === null ? {} : asObject(value, 'input');
    const unknown = Object.keys(raw).filter((key) => !INPUT_FIELDS.has(key));
    if (unknown.length > 0) fail(`Unsupported input field(s): ${unknown.join(', ')}.`);

    const appIds = raw.appIds === undefined
        ? ['6448311069']
        : stringArray(raw.appIds, 'appIds', 50, 500).map(normalizeAppId);
    return {
        appIds: [...new Set(appIds)],
        maxResults: maxResults(raw.maxResults),
        country: locale(raw.country, 'country', 'us'),
        proxyConfiguration: normalizeProxy(raw.proxyConfiguration),
    };
}
