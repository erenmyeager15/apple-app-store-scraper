import { Actor, log } from 'apify';
import { HttpCrawler } from '@crawlee/http';
import { buildLookupUrl, parseLookupPayload, splitIntoBatches } from './api.js';
import { normalizeInput } from './input.js';
import { mapApp, rawAppId } from './routes.js';
import { classifyOutcome } from './status.js';
import type { RunCounters, RunDiagnostic } from './types.js';
import { validateAppRecord } from './validation.js';

const APP_SCRAPED_EVENT = 'app-scraped';

function safeErrorMessage(error: unknown): string {
    const message = (error instanceof Error ? error.message : String(error)).trim() || 'Unknown source error';
    return message
        .replace(/https?:\/\/[^@\s]+@/gi, 'https://[redacted]@')
        .slice(0, 500);
}

function addDiagnostic(diagnostics: RunDiagnostic[], diagnostic: RunDiagnostic): void {
    if (diagnostics.length < 20) diagnostics.push(diagnostic);
}

function requestIds(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string' && /^[1-9]\d{5,19}$/.test(item));
}

function parseResponseBody(body: unknown): unknown[] {
    const raw = Buffer.isBuffer(body) ? body.toString('utf8') : String(body ?? '');
    const trimmed = raw.trim();
    if (!trimmed.startsWith('{')) throw new Error('Apple lookup returned a non-JSON response.');
    return parseLookupPayload(JSON.parse(trimmed));
}

await Actor.init();

const startedAt = Date.now();
const counters: RunCounters = {
    requested: 0,
    attempted: 0,
    fetched: 0,
    notFound: 0,
    failed: 0,
    invalid: 0,
    saved: 0,
    retries: 0,
};
const diagnostics: RunDiagnostic[] = [];
let spendingLimitReached = false;

try {
    const input = normalizeInput(await Actor.getInput<unknown>());
    const targetIds = input.appIds.slice(0, input.maxResults);
    counters.requested = targetIds.length;
    const proxyConfiguration = await Actor.createProxyConfiguration(input.proxyConfiguration);
    const attemptedIds = new Set<string>();
    const completedIds = new Set<string>();

    const requests = splitIntoBatches(targetIds).map((appIds, index) => ({
        url: buildLookupUrl(appIds, input.country),
        uniqueKey: `apple-app-lookup-${input.country}-${index}-${appIds.join('-')}`,
        userData: { appIds },
    }));

    const crawler = new HttpCrawler({
        proxyConfiguration,
        additionalMimeTypes: ['application/json', 'text/javascript'],
        maxConcurrency: 1,
        maxRequestsPerMinute: 18,
        maxRequestRetries: 2,
        requestHandlerTimeoutSecs: 30,
        retryOnBlocked: true,
        requestHandler: async ({ request, body, crawler: activeCrawler }) => {
            if (spendingLimitReached) return;
            const expectedIds = requestIds(request.userData.appIds);
            for (const appId of expectedIds) {
                if (!attemptedIds.has(appId)) {
                    attemptedIds.add(appId);
                    counters.attempted += 1;
                }
            }
            counters.retries += request.retryCount;

            const expected = new Set(expectedIds);
            const returned = new Set<string>();
            for (const raw of parseResponseBody(body)) {
                if (spendingLimitReached) break;
                const appId = rawAppId(raw);
                if (!appId || !expected.has(appId)) {
                    addDiagnostic(diagnostics, {
                        appId: appId ?? 'unknown',
                        kind: 'unexpected_record',
                        message: 'Apple lookup returned a record outside the requested app ID batch.',
                    });
                    continue;
                }
                if (completedIds.has(appId) || returned.has(appId)) continue;
                returned.add(appId);
                counters.fetched += 1;

                const record = mapApp(raw, input.country);
                const errors = validateAppRecord(record, appId);
                if (errors.length > 0) {
                    completedIds.add(appId);
                    counters.invalid += 1;
                    addDiagnostic(diagnostics, {
                        appId,
                        kind: 'invalid_record',
                        message: errors.join('; ').slice(0, 500),
                    });
                    log.warning(`Skipped invalid Apple App Store record for ${appId} before billing.`, { errors });
                    continue;
                }

                const chargeResult = await Actor.pushData(record, APP_SCRAPED_EVENT);
                const saved = chargeResult.chargedCount > 0 || !chargeResult.eventChargeLimitReached;
                if (saved) {
                    completedIds.add(appId);
                    counters.saved += 1;
                }
                if (!saved || chargeResult.eventChargeLimitReached) {
                    spendingLimitReached = true;
                    await Actor.setStatusMessage(`Stopped at the user's spending limit after ${counters.saved} apps`);
                    await activeCrawler.autoscaledPool?.abort();
                    break;
                }
            }

            if (!spendingLimitReached) {
                for (const appId of expectedIds) {
                    if (!returned.has(appId) && !completedIds.has(appId)) {
                        completedIds.add(appId);
                        counters.notFound += 1;
                        addDiagnostic(diagnostics, {
                            appId,
                            kind: 'not_found',
                            message: 'App ID was not available in the selected Apple storefront.',
                        });
                    }
                }
            }
        },
        failedRequestHandler: async ({ request }, error) => {
            const expectedIds = requestIds(request.userData.appIds);
            for (const appId of expectedIds) {
                if (!attemptedIds.has(appId)) {
                    attemptedIds.add(appId);
                    counters.attempted += 1;
                }
                if (completedIds.has(appId)) continue;
                completedIds.add(appId);
                counters.failed += 1;
                addDiagnostic(diagnostics, {
                    appId,
                    kind: 'source_error',
                    message: safeErrorMessage(error),
                });
            }
            counters.retries += request.retryCount;
            log.warning('Direct Apple lookup batch failed after bounded retries.', {
                appIds: expectedIds,
                error: safeErrorMessage(error),
            });
        },
    });

    await crawler.run(requests);
    const outcome = classifyOutcome(counters, spendingLimitReached);
    await Actor.setValue('RUN_STATUS', {
        generatedAt: new Date().toISOString(),
        outcome,
        scope: 'direct_app_ids_only',
        country: input.country,
        spendingLimitReached,
        durationMs: Date.now() - startedAt,
        counters,
        diagnostics,
    });

    if (outcome === 'failed') {
        throw new Error('No valid Apple App Store records were collected from the direct lookup API.');
    }
    if (!spendingLimitReached) {
        await Actor.setStatusMessage(
            outcome === 'empty'
                ? 'Finished: none of the requested app IDs were available in this storefront'
                : outcome === 'partial'
                    ? `Finished with ${counters.saved} apps and ${counters.failed + counters.invalid + counters.notFound} issue(s)`
                    : `Finished with ${counters.saved} validated Apple App Store apps`,
        );
    }
    log.info('Apple App Store direct lookup finished.', { outcome, counters });
} catch (error) {
    const existing = await Actor.getValue<Record<string, unknown>>('RUN_STATUS');
    if (!existing) {
        await Actor.setValue('RUN_STATUS', {
            generatedAt: new Date().toISOString(),
            outcome: 'failed',
            scope: 'direct_app_ids_only',
            spendingLimitReached,
            durationMs: Date.now() - startedAt,
            counters,
            diagnostics,
            fatalError: safeErrorMessage(error),
        });
    }
    throw error;
}

await Actor.exit();
