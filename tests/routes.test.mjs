import assert from 'node:assert/strict';
import test from 'node:test';
import { mapApp, rawAppId } from '../dist/routes.js';
import { APP_RECORD_FIELDS } from '../dist/validation.js';

const rawApp = {
    wrapperType: 'software',
    kind: 'software',
    trackId: 6448311069,
    trackName: ' ChatGPT ',
    bundleId: 'com.openai.chat',
    sellerName: 'OpenAI OpCo, LLC',
    artistId: 1684349733,
    primaryGenreName: 'Productivity',
    primaryGenreId: 6007,
    genres: ['Productivity', 'Utilities'],
    genreIds: ['6007', '6002'],
    price: 0,
    formattedPrice: 'Free',
    currency: 'usd',
    averageUserRating: 4.8,
    userRatingCount: 123456,
    averageUserRatingForCurrentVersion: 4.7,
    userRatingCountForCurrentVersion: 1000,
    contentAdvisoryRating: '12+',
    version: '1.2.3',
    minimumOsVersion: '17.0',
    fileSizeBytes: '244295680',
    releaseDate: '2023-05-25T07:00:00Z',
    currentVersionReleaseDate: '2026-07-01T12:00:00Z',
    trackViewUrl: 'https://apps.apple.com/us/app/chatgpt/id6448311069?uo=4',
    description: 'Not exported',
    releaseNotes: 'Not exported',
    artworkUrl512: 'https://example.com/icon.png',
    screenshotUrls: ['https://example.com/screenshot.png'],
};

test('maps only the bounded factual app contract', () => {
    const record = mapApp(rawApp, 'us');
    assert.deepEqual(Object.keys(record), APP_RECORD_FIELDS);
    assert.equal(rawAppId(rawApp), '6448311069');
    assert.equal(record.appName, 'ChatGPT');
    assert.equal(record.primaryGenreId, '6007');
    assert.deepEqual(record.genreIds, ['6007', '6002']);
    assert.equal(record.currency, 'USD');
    assert.equal(record.isFree, true);
    assert.equal(record.currentVersionReleaseDate, '2026-07-01T12:00:00.000Z');
    for (const forbidden of ['description', 'releaseNotes', 'artworkUrl', 'screenshotUrls', 'sellerUrl']) {
        assert.equal(forbidden in record, false);
    }
});

test('unknown or malformed optional values map to null or empty arrays', () => {
    const record = mapApp({
        trackId: 284882215,
        trackName: 'Example',
        bundleId: 'com.example.app',
        sellerName: 'Example Developer',
        trackViewUrl: 'https://apps.apple.com/us/app/example/id284882215',
    }, 'gb');
    assert.equal(record.rating, null);
    assert.equal(record.releaseDate, null);
    assert.equal(record.isFree, null);
    assert.deepEqual(record.genres, []);
});
