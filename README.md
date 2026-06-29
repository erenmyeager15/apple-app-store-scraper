# Apple App Store Scraper - Apps, Ratings & Prices

Scrape public Apple App Store app metadata by keyword or numeric app ID through Apple's public iTunes Search API. Export app names, developers, ratings, prices, genres, versions, content ratings, screenshots, descriptions, release dates, and App Store URLs to JSON, CSV, Excel, HTML, or the Apify API.

This Actor is API-based, fast, and does not need a login or API key. Proxy is disabled by default for the quick-start path.

## What It Extracts

- App ID, app name, bundle ID, developer, developer ID, developer URL
- Price, formatted price, currency
- Average rating, rating count, current-version rating metrics
- Primary genre, genres, content rating, version, minimum OS version, file size
- App Store URL, artwork URL, screenshot URLs, supported languages
- Description, release date, current version release date, release notes
- Country storefront and scrape timestamp

## Quick Start

Use this small input first:

```json
{
  "searchTerms": [],
  "appIds": ["6448311069"],
  "entity": "software",
  "country": "us",
  "maxResultsPerTerm": 1,
  "proxyConfiguration": {
    "useApifyProxy": false
  }
}
```

## Input

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `searchTerms` | array<string> | `[]` | Keywords to search, e.g. `photo editor` or `vpn`. |
| `appIds` | array<string> | `["6448311069"]` | Numeric App Store track IDs. |
| `entity` | string | `software` | Use `software`, `iPadSoftware`, or `macSoftware`. |
| `country` | string | `us` | Two-letter App Store storefront code. |
| `maxResultsPerTerm` | integer | `1` | Maximum apps per search term. Use 1-5 for tests; Apple caps search at 200. |
| `proxyConfiguration` | object | disabled | Keep disabled unless large runs start hitting rate limits. |

## Output Dataset

The dataset saves one clean app row for each matched App Store result. The default table view focuses on app-level metadata, and JSON export includes richer arrays such as genres, screenshots, and supported languages.

Verified sample from an existing successful run:

```json
{
  "appId": 6448311069,
  "appName": "ChatGPT",
  "bundleId": "com.openai.chat",
  "developer": "OpenAI OpCo, LLC",
  "developerId": 1684349733,
  "price": 0,
  "formattedPrice": "Free",
  "currency": "USD",
  "rating": 4.83381,
  "ratingCount": 8072064,
  "primaryGenre": "Productivity",
  "genres": ["Productivity", "Utilities"],
  "contentRating": "12+",
  "version": "1.2026.160",
  "minimumOsVersion": "17.0",
  "fileSizeBytes": 244295680,
  "appStoreUrl": "https://apps.apple.com/us/app/chatgpt/id6448311069?uo=4",
  "currentVersionReleaseDate": "2026-06-16T14:05:27Z",
  "releaseNotes": "Bug fixes and small improvements.",
  "country": "us",
  "scrapedAt": "2026-06-21T18:28:25.355Z"
}
```

## Pricing And Cost Control

Current live pricing checked on 2026-06-29:

| Event | Active price |
| --- | ---: |
| `app-scraped` | `$0.002` per app row |
| `apify-actor-start` | `$0.00005` per GB |

Apps are saved and charged atomically, and the Actor stops before further requests when the user's spending limit is reached.

Cost-control tips:

- Start with one app ID and `maxResultsPerTerm: 1`.
- Keep proxy disabled for normal API-sized runs.
- Use `country` deliberately because ratings, prices, and availability can differ by storefront.
- Split broad keyword research into smaller runs.

## Use Cases

- App Store Optimization (ASO) research
- Competitor metadata, version, and pricing tracking
- Category and storefront analysis
- Cross-store app intelligence with a Google Play scraper

## Known Limits

- Apple's public iTunes Search API may omit some storefront-specific fields.
- Search results are capped by Apple's API, so direct app ID lookup is best for exact apps.
- Ratings and prices can differ by country storefront.

## Responsible Use

Use this Actor only for lawful collection and analysis of public app-store data. Follow Apple's terms, applicable privacy laws, anti-spam rules, and local regulations.

## License

Apache-2.0
