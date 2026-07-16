# Apple App Store Metadata & Ratings Scraper

Look up factual public Apple App Store metadata by numeric app ID or official App Store URL. The Actor uses Apple's documented iTunes Search API lookup endpoint and returns validated app identity, developer, category, aggregate ratings, price, version, compatibility, dates, and the official listing URL.

This version deliberately supports direct app lookups only. It does not perform keyword discovery, scrape App Store pages, collect reviews, or export descriptions, release notes, icons, screenshots, or other promotional assets.

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
