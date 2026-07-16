import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeAppId, normalizeInput } from '../dist/input.js';

test('blank input becomes the bounded one-app QA sample', () => {
    assert.deepEqual(normalizeInput(undefined), {
        appIds: ['6448311069'],
        maxResults: 1,
        country: 'us',
        proxyConfiguration: { useApifyProxy: false },
    });
});

test('numeric IDs and official app URLs normalize and deduplicate', () => {
    const input = normalizeInput({
        appIds: [
            '6448311069',
            'https://apps.apple.com/us/app/chatgpt/id6448311069?platform=iphone',
            '284882215',
        ],
        maxResults: 2,
        country: 'IN',
    });
    assert.deepEqual(input.appIds, ['6448311069', '284882215']);
    assert.equal(input.country, 'in');
});

test('legacy broad-discovery fields are rejected', () => {
    for (const field of ['searchTerms', 'entity', 'maxResultsPerTerm', 'keywords']) {
        assert.throws(() => normalizeInput({ appIds: ['6448311069'], [field]: true }), /Unsupported input field/);
    }
});

test('invalid IDs, hosts, country codes, and oversized runs are rejected', () => {
    assert.throws(() => normalizeAppId('not-an-id'), /Invalid Apple App Store app ID/);
    assert.throws(() => normalizeAppId('https://example.com/app/id6448311069'), /must use an official/);
    assert.throws(() => normalizeInput({ country: 'usa' }), /two-letter code/);
    assert.throws(() => normalizeInput({ maxResults: 51 }), /between 1 and 50/);
});

test('proxy modes cannot be mixed or configured implicitly', () => {
    assert.throws(() => normalizeInput({
        proxyConfiguration: { useApifyProxy: true, proxyUrls: ['https://proxy.example:8000'] },
    }), /either Apify Proxy or custom/);
    assert.throws(() => normalizeInput({
        proxyConfiguration: { useApifyProxy: false, apifyProxyCountry: 'US' },
    }), /Enable useApifyProxy/);
});
