export interface ActorInput {
    searchTerms?: string[];
    appIds?: string[];
    entity?: string;
    country?: string;
    maxResultsPerTerm?: number;
    proxyConfiguration?: {
        useApifyProxy?: boolean;
        apifyProxyGroups?: string[];
        proxyUrls?: string[];
    };
}

export interface AppRecord {
    appId: number | null;
    appName: string | null;
    bundleId: string | null;
    developer: string | null;
    developerId: number | null;
    developerUrl: string | null;
    price: number | null;
    formattedPrice: string | null;
    currency: string | null;
    rating: number | null;
    ratingCount: number | null;
    ratingCurrentVersion: number | null;
    ratingCountCurrentVersion: number | null;
    primaryGenre: string | null;
    genres: string[];
    contentRating: string | null;
    version: string | null;
    minimumOsVersion: string | null;
    fileSizeBytes: number | null;
    appStoreUrl: string | null;
    artworkUrl: string | null;
    screenshotUrls: string[];
    languages: string[];
    description: string | null;
    releaseDate: string | null;
    currentVersionReleaseDate: string | null;
    releaseNotes: string | null;
    country: string;
    scrapedAt: string;
}
