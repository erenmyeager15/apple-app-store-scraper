# Apple App Store Scraper - Ratings, Prices & Versions

Build an iOS competitor snapshot for US app agencies, ASO consultants and product teams. Compare known apps by aggregate ratings, rating counts, versions, release dates and download prices, then export CSV for a client brief or your own spreadsheet comparison.

Enter numeric app IDs or official App Store URLs and choose a storefront. The Actor uses Apple's documented iTunes Search API lookup endpoint and returns validated factual metadata, stable identifiers and official listing links. No Apple API key or login is required; the US starter uses no proxy.

## US app agency workflows

| Research question | Fields to compare | Client deliverable |
| --- | --- | --- |
| How do known competitors compare in the US storefront? | `rating`, `ratingCount`, `developer`, `primaryGenre` | A dated competitor table with official listing links |
| Which competitors released a new version? | `version`, `currentVersionReleaseDate`, `minimumOsVersion` | A release comparison between two saved snapshots |
| Did the listed download price change? | `price`, `currency`, `isFree` | Same-storefront price changes with collection dates |
| Which apps need deeper research? | `appId`, `bundleId`, `appStoreUrl` | A traceable shortlist for a client review |

Ratings are aggregate storefront observations. They do not describe a US audience demographic or reveal downloads, revenue or active users. Listed download prices exclude subscriptions and in-app purchases.

This version deliberately supports direct app lookups only. It does not perform keyword discovery, scrape App Store pages, collect reviews, or export descriptions, release notes, icons, screenshots, or other promotional assets.

## Three-app US competitor-research starter

Start with Notion, Evernote and Microsoft OneNote in the US storefront. They are illustrative productivity competitors, not a ranking or endorsement. Replace their IDs with your client's app and two known competitors.

[Open US iOS App Competitor Research](https://apify.com/fascinating_lentil/apple-app-store-scraper/examples/us-ios-competitor-research)

```json
{
  "appIds": ["1232780281", "281796108", "410395246"],
  "maxResults": 3,
  "country": "us",
  "proxyConfiguration": {
    "useApifyProxy": false
  }
}
```

This saved configuration has been checked against the existing input contract and official US listing URLs. It has not been run as a new cloud test. Set `maxResults` to the number of unique apps you want to process: the Actor's unchanged default is one app. The starter is capped at three apps and has no schedule.

## CSV comparison guide

1. Run the same known app IDs with `country: "us"` and check the `RUN_STATUS` outcome and saved count.
2. Export the dataset as CSV with all fields. Keep `appId`, `country`, `appName`, `rating`, `ratingCount`, `version`, `currentVersionReleaseDate`, `price`, `currency`, `appStoreUrl` and `scrapedAt`.
3. Save the first file as your baseline. On your chosen review date, collect another snapshot with the same IDs and storefront.
4. Join the two files on **`appId` + `country`**, using IDs as text. App names and versions can change and are not stable join keys.
5. Compare ratings in rating points, rating counts as a net count change, versions as text, and download prices only when both prices are present and currencies match.

The Actor produces snapshots and run diagnostics. Persistent history, change alerts and a combined comparison report are assembled in your own spreadsheet or downstream workflow; this Actor does not generate them.

Use the [field-by-field comparison guide](https://github.com/erenmyeager15/apple-app-store-scraper/blob/main/examples/US-IOS-COMPARISON-GUIDE.md) for rules on missing values, versions, free prices and incomplete runs.

## Quick Start

```json
{
  "appIds": ["6448311069"],
  "maxResults": 1,
  "country": "us",
  "proxyConfiguration": {
    "useApifyProxy": false
  }
}
```

`appIds` also accepts official URLs such as:

```text
https://apps.apple.com/us/app/chatgpt/id6448311069
```

## Input

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `appIds` | array<string> | `["6448311069"]` | Up to 50 numeric IDs or official `apps.apple.com` app URLs. |
| `maxResults` | integer | `1` | Maximum unique IDs to process, from 1 to 50. |
| `country` | string | `us` | Two-letter storefront country code. |
| `proxyConfiguration` | object | disabled | Optional Apify or custom HTTP(S) proxy settings. |

Unsupported or legacy fields are rejected instead of being silently ignored.

## Output

Each charged dataset row is validated against a fixed factual-data contract:

- App ID, app name, bundle ID
- Developer and developer ID
- Primary genre, genre names, and genre IDs
- Price, formatted price, currency, and free/paid flag
- Aggregate rating and rating count, including current-version aggregates when available
- Content rating, version, minimum OS version, and file size
- Initial release date and current-version release date
- Official App Store URL and storefront country
- Collection timestamp

The `RUN_STATUS` key-value-store record contains the final outcome, counters, spending-limit state, and at most 20 bounded diagnostics. Outcomes are `succeeded`, `partial`, `empty`, `failed`, or `stopped_spending_limit`.

## Verified Sample Output

This record came from Apple's public lookup API for ChatGPT on August 2, 2026. Store values can change after collection.

```json
{
  "source": "apple_app_store",
  "recordType": "app",
  "appId": "6448311069",
  "appName": "ChatGPT",
  "bundleId": "com.openai.chat",
  "developer": "OpenAI OpCo, LLC",
  "developerId": "1684349733",
  "primaryGenre": "Productivity",
  "primaryGenreId": "6007",
  "genres": ["Productivity", "Utilities"],
  "genreIds": ["6007", "6002"],
  "price": 0,
  "priceText": "Free",
  "currency": "USD",
  "isFree": true,
  "rating": 4.83068,
  "ratingCount": 9028052,
  "contentRating": "12+",
  "version": "1.2026.202",
  "minimumOsVersion": "17.0",
  "fileSizeBytes": 205886464,
  "releaseDate": "2023-05-18T07:00:00.000Z",
  "currentVersionReleaseDate": "2026-07-27T16:41:51.000Z",
  "appStoreUrl": "https://apps.apple.com/us/app/chatgpt/id6448311069?uo=4",
  "country": "us",
  "scrapedAt": "2026-08-01T21:14:57.134Z"
}
```

## Pricing

| Event | Price |
| --- | ---: |
| `app-scraped` | `$0.002` per validated app row |
| `apify-actor-start` | `$0.00005` per GB, minimum one event |

Apify Console shows the authoritative current price. Each validated record is saved and charged atomically.

At the listed rate, three successfully saved apps cost `$0.006` in app events plus the start event (one `$0.00005` event at the current 512 MB default). This is the advertised result charge, not a new usage-cost or profitability measurement. The Actor's current pay-per-event model includes platform usage in the price.

## Reliability And Cost Controls

- Maximum 50 unique apps per run
- Direct ID lookups batched in groups of at most 25
- One request worker and at most 18 API requests per minute
- 30-second request deadline and two bounded retries
- Duplicate and out-of-batch records ignored
- Every output row validated before it is saved and charged
- Atomic `$0.002` `app-scraped` event per saved app
- Clean stop when the user's maximum run cost is reached
- 512 MB maximum Actor memory and 30-minute run timeout

The default one-app input is suitable for Apify's automated quality check. Proxy is normally unnecessary for this official API route.

## Source Scope

Apple documents ID-based lookup for mapping a content library to its digital catalog. Apple also places conditions on promotional content returned by the API. This Actor therefore omits artwork, screenshots, descriptions, and release notes and keeps only bounded factual metadata and aggregate metrics.

- [iTunes Search API overview](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/)
- [Official lookup examples](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/LookupExamples.html)
- [Search API request guidance](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/Searching.html)

These technical safeguards are not legal advice or blanket permission for every downstream use. Users remain responsible for Apple's current terms, applicable laws, and rights in exported data.

## Known Limits

- Availability, price, and rating aggregates can vary by storefront.
- Missing app IDs produce a successful `empty` or `partial` outcome rather than fabricated rows.
- Apple can change or retire this archived API and its response fields.
- This Actor is independent and is not affiliated with or endorsed by Apple.

## License

Apache-2.0
