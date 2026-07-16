import assert from 'node:assert/strict';
import test from 'node:test';
import { buildLookupUrl, parseLookupPayload, splitIntoBatches } from '../dist/api.js';

test('builds only the official direct lookup endpoint', () => {
    assert.equal(
        buildLookupUrl(['6448311069', '284882215'], 'us'),
        'https://itunes.apple.com/lookup?id=6448311069,284882215&country=us',
    );
});

test('splits app IDs into bounded lookup batches', () => {
    const ids = Array.from({ length: 50 }, (_, index) => String(1_000_000 + index));
    const batches = splitIntoBatches(ids);
    assert.equal(batches.length, 2);
    assert.equal(batches[0].length, 25);
    assert.equal(batches[1].length, 25);
});

test('rejects oversized lookup batches', () => {
    const ids = Array.from({ length: 26 }, (_, index) => String(1_000_000 + index));
    assert.throws(() => buildLookupUrl(ids, 'us'), /1-25/);
});

test('accepts only lookup objects with a results array', () => {
    assert.deepEqual(parseLookupPayload({ resultCount: 0, results: [] }), []);
    assert.throws(() => parseLookupPayload([]), /non-object/);
    assert.throws(() => parseLookupPayload({ resultCount: 0 }), /results array/);
});
