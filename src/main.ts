import { Actor, log } from 'apify';
import { HttpCrawler } from 'crawlee';
import type { ActorInput } from './types.js';
import { buildRouter } from './routes.js';

await Actor.init();

const input = ((await Actor.getInput<ActorInput>()) ?? {}) as ActorInput;
const {
    searchTerms = [],
    appIds = [],
    entity = 'software',
    country = 'us',
    maxResultsPerTerm = 50,
    proxyConfiguration: proxyInput,
} = input;

const terms = searchTerms.map((t) => t.trim()).filter(Boolean);
const ids = appIds.map((i) => String(i).trim()).filter(Boolean);
const ctry = (country || 'us').trim().toLowerCase();
const limit = Math.min(Math.max(maxResultsPerTerm || 50, 1), 200); // iTunes caps search at 200

if (terms.length === 0 && ids.length === 0) {
    log.error('No input. Provide searchTerms (e.g. "weather") or appIds (e.g. "284882215").');
    await Actor.exit();
}

log.info(`Starting Apple App Store scrape: ${terms.length} search term(s), ${ids.length} app id(s) | country=${ctry}`);

const proxyConfiguration = await Actor.createProxyConfiguration(proxyInput ?? { useApifyProxy: false });

const startRequests = [
    ...terms.map((term) => ({
        url: `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=${encodeURIComponent(entity)}&limit=${limit}&country=${ctry}`,
        userData: { label: 'RESULTS' as const, source: `search:${term}` },
    })),
    // iTunes lookup accepts comma-separated ids (batch up to ~200).
    ...(ids.length
        ? [{
              url: `https://itunes.apple.com/lookup?id=${ids.join(',')}&country=${ctry}&entity=${encodeURIComponent(entity)}`,
              userData: { label: 'RESULTS' as const, source: 'lookup' },
          }]
        : []),
];

const router = buildRouter({ country: ctry });

const crawler = new HttpCrawler({
    proxyConfiguration,
    requestHandler: router,
    additionalMimeTypes: ['application/json', 'text/javascript'],
    maxConcurrency: 10,
    maxRequestRetries: 5,
    requestHandlerTimeoutSecs: 60,
    retryOnBlocked: true,
    sessionPoolOptions: { maxPoolSize: 50, sessionOptions: { maxUsageCount: 30 } },
    failedRequestHandler: async ({ request }, error) => {
        log.warning(`Failed: ${request.url} - ${(error as Error)?.message ?? error}`);
    },
});

await crawler.run(startRequests);
log.info('Apple App Store scrape finished.');
await Actor.exit();
