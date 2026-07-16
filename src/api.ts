const BATCH_SIZE = 25;

export function buildLookupUrl(appIds: string[], country: string): string {
    if (appIds.length === 0 || appIds.length > BATCH_SIZE) {
        throw new Error(`Apple lookup batches must contain 1-${BATCH_SIZE} app IDs.`);
    }
    return `https://itunes.apple.com/lookup?id=${appIds.join(',')}&country=${country}`;
}

export function splitIntoBatches<T>(values: T[], size = BATCH_SIZE): T[][] {
    if (!Number.isInteger(size) || size < 1 || size > BATCH_SIZE) {
        throw new Error(`Batch size must be an integer between 1 and ${BATCH_SIZE}.`);
    }
    const batches: T[][] = [];
    for (let index = 0; index < values.length; index += size) {
        batches.push(values.slice(index, index + size));
    }
    return batches;
}

export function parseLookupPayload(value: unknown): unknown[] {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Apple lookup returned a non-object payload.');
    }
    const results = (value as { results?: unknown }).results;
    if (!Array.isArray(results)) throw new Error('Apple lookup payload is missing the results array.');
    return results;
}
