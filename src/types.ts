export interface ProxyInput {
    useApifyProxy?: boolean;
    apifyProxyGroups?: string[];
    apifyProxyCountry?: string;
    proxyUrls?: string[];
}

export interface NormalizedInput {
    appIds: string[];
    maxResults: number;
    country: string;
    proxyConfiguration: ProxyInput;
}

export interface AppRecord {
    source: 'apple_app_store';
    recordType: 'app';
    appId: string;
    appName: string;
    bundleId: string;
    developer: string;
    developerId: string | null;
    primaryGenre: string | null;
    primaryGenreId: string | null;
    genres: string[];
    genreIds: string[];
    price: number | null;
    priceText: string | null;
    currency: string | null;
    isFree: boolean | null;
    rating: number | null;
    ratingCount: number | null;
    ratingCurrentVersion: number | null;
    ratingCountCurrentVersion: number | null;
    contentRating: string | null;
    version: string | null;
    minimumOsVersion: string | null;
    fileSizeBytes: number | null;
    releaseDate: string | null;
    currentVersionReleaseDate: string | null;
    appStoreUrl: string;
    country: string;
    scrapedAt: string;
}

export type RunOutcome = 'succeeded' | 'partial' | 'empty' | 'failed' | 'stopped_spending_limit';

export interface RunCounters {
    requested: number;
    attempted: number;
    fetched: number;
    notFound: number;
    failed: number;
    invalid: number;
    saved: number;
    retries: number;
}

export interface RunDiagnostic {
    appId: string;
    kind: 'not_found' | 'source_error' | 'invalid_record' | 'unexpected_record';
    message: string;
}
