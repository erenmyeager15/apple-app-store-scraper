import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { APP_RECORD_FIELDS } from '../dist/validation.js';

const readText = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const readJson = async (path) => JSON.parse(await readText(path));

test('Store sample and input schema enforce direct bounded lookups', async () => {
    const [actor, schema, input] = await Promise.all([
        readJson('../.actor/actor.json'),
        readJson('../INPUT_SCHEMA.json'),
        readJson('../input.json'),
    ]);
    const example = JSON.parse(actor.exampleRunInput.body);
    assert.deepEqual(example.appIds, ['6448311069']);
    assert.deepEqual(input, example);
    assert.equal(schema.additionalProperties, false);
    assert.deepEqual(Object.keys(schema.properties), ['appIds', 'maxResults', 'country', 'proxyConfiguration']);
    assert.equal(schema.properties.appIds.maxItems, 50);
    assert.equal(schema.properties.maxResults.maximum, 50);
    assert.equal(actor.defaultRunOptions.memoryMbytes, 512);
    assert.equal(actor.maxMemoryMbytes, 512);
    assert.ok(actor.defaultRunOptions.timeoutSecs <= 1800);
});

test('runtime calls only official direct lookup and omits broad discovery', async () => {
    const [main, api] = await Promise.all([
        readText('../src/main.ts'),
        readText('../src/api.ts'),
    ]);
    assert.match(api, /https:\/\/itunes\.apple\.com\/lookup/);
    assert.doesNotMatch(main, /searchTerms|maxResultsPerTerm/);
    assert.doesNotMatch(`${main}\n${api}`, /itunes\.apple\.com\/search/);
});

test('dataset schema exactly matches the validated factual contract', async () => {
    const [actor, output, dataset, pkg, dockerfile, routes] = await Promise.all([
        readJson('../.actor/actor.json'),
        readJson('../.actor/output_schema.json'),
        readJson('../.actor/dataset_schema.json'),
        readJson('../package.json'),
        readText('../.actor/Dockerfile'),
        readText('../src/routes.ts'),
    ]);
    assert.equal(actor.output, './output_schema.json');
    assert.equal(actor.storages.dataset, './dataset_schema.json');
    assert.deepEqual(Object.keys(dataset.fields.properties), APP_RECORD_FIELDS);
    assert.deepEqual(dataset.fields.required, APP_RECORD_FIELDS);
    assert.equal(dataset.fields.additionalProperties, false);
    assert.ok(dataset.views.apps);
    assert.ok(output.properties.runStatus);
    assert.match(pkg.scripts.test, /node --test/);
    assert.match(dockerfile, /npm ci/);
    for (const forbidden of ['description:', 'releaseNotes:', 'artworkUrl:', 'screenshotUrls:']) {
        assert.doesNotMatch(routes, new RegExp(forbidden));
    }
});

test('authoritative live pricing remains unchanged', async () => {
    const actor = await readJson('../.actor/actor.json');
    const events = actor.pricingInfo.pricingPerEvent.actorChargeEvents;
    assert.equal(events['app-scraped'].eventPriceUsd, 0.002);
    assert.equal(events['apify-actor-start'].eventPriceUsd, 0.00005);
    assert.deepEqual(Object.keys(events), ['app-scraped', 'apify-actor-start']);
});
