import assert from 'node:assert/strict';
import test from 'node:test';
import { mapApp } from '../dist/routes.js';
import { validateAppRecord } from '../dist/validation.js';

const validRaw = {
    trackId: 6448311069,
    trackName: 'ChatGPT',
    bundleId: 'com.openai.chat',
    sellerName: 'OpenAI OpCo, LLC',
    price: 0,
    averageUserRating: 4.8,
    userRatingCount: 10,
    trackViewUrl: 'https://apps.apple.com/us/app/chatgpt/id6448311069?uo=4',
};

test('accepts a valid matching direct app record', () => {
    assert.deepEqual(validateAppRecord(mapApp(validRaw, 'us'), '6448311069'), []);
});

test('rejects mismatched identity, invalid bounds, and non-official URLs', () => {
    const record = mapApp(validRaw, 'us');
    record.rating = 8;
    record.appStoreUrl = 'https://example.com/app';
    const errors = validateAppRecord(record, '284882215');
    assert.ok(errors.some((message) => message.includes('appId does not match')));
    assert.ok(errors.some((message) => message.includes('between 0 and 5')));
    assert.ok(errors.some((message) => message.includes('official Apple App Store')));
});

test('rejects records without required identity text', () => {
    const record = mapApp(validRaw, 'us');
    record.appName = '';
    record.bundleId = '';
    record.developer = '';
    const errors = validateAppRecord(record, '6448311069');
    assert.ok(errors.some((message) => message.startsWith('appName')));
    assert.ok(errors.some((message) => message.startsWith('bundleId')));
    assert.ok(errors.some((message) => message.startsWith('developer')));
});
