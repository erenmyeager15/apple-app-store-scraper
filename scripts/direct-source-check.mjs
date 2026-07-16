import { buildLookupUrl, parseLookupPayload } from '../dist/api.js';
import { mapApp, rawAppId } from '../dist/routes.js';
import { validateAppRecord } from '../dist/validation.js';

const appId = process.argv[2] ?? '6448311069';
const country = (process.argv[3] ?? 'us').toLowerCase();
const response = await fetch(buildLookupUrl([appId], country), {
    headers: { 'user-agent': 'Apify Apple App Store metadata source check/1.0' },
    signal: AbortSignal.timeout(20_000),
});
if (!response.ok) throw new Error(`Apple lookup returned HTTP ${response.status}.`);
const results = parseLookupPayload(await response.json());
const raw = results.find((item) => rawAppId(item) === appId);
if (!raw) throw new Error(`Apple lookup did not return app ID ${appId} in storefront ${country}.`);
const record = mapApp(raw, country);
const errors = validateAppRecord(record, appId);
if (errors.length > 0) throw new Error(`Source record failed validation: ${errors.join('; ')}`);

console.log(JSON.stringify({
    appId: record.appId,
    appName: record.appName,
    developer: record.developer,
    rating: record.rating,
    ratingCount: record.ratingCount,
    version: record.version,
    appStoreUrl: record.appStoreUrl,
}, null, 2));
