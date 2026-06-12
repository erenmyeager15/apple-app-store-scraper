# Apple App Store Scraper - Apps, Ratings & Prices

Scrape **app data from the Apple App Store** - no login, no API key required. Search by keyword or look up specific apps by ID to extract names, developers, ratings, review counts, prices, genres, versions, content ratings, screenshots, descriptions, and release dates. Choose any country storefront. Export to **JSON, CSV, Excel, or HTML**, or pull via the Apify API.

Perfect for **app store optimization (ASO), competitor tracking, market research, and app intelligence**.

## Features

- ✅ **No login or API key** - uses Apple's public iTunes Search API
- ✅ **Search or lookup** - by keyword(s) or specific app ID(s)
- ✅ **iPhone, iPad, or Mac apps**
- ✅ **Any country storefront** - `us`, `gb`, `in`, `de`, and more
- ✅ **Rich metadata** - rating, rating count, price, genre, version, min OS, size, screenshots, languages
- ✅ **Fast & lightweight** - pure JSON, no headless browser

## Input

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `searchTerms` | `string[]` | Keywords to search, e.g. `"weather"` | `["weather"]` |
| `appIds` | `string[]` | Specific App Store app IDs (numeric trackId) | `[]` |
| `entity` | `string` | `software` (iPhone), `iPadSoftware`, `macSoftware` | `software` |
| `country` | `string` | Two-letter storefront code | `us` |
| `maxResultsPerTerm` | `integer` | Max apps per search term (App Store caps at 200) | `50` |
| `proxyConfiguration` | `object` | Proxy (helps avoid rate limits on large runs) | Apify Proxy |

### Example input

```json
{
  "searchTerms": ["photo editor", "vpn"],
  "appIds": ["284882215"],
  "entity": "software",
  "country": "us",
  "maxResultsPerTerm": 100
}
```

## Sample output

```json
{
  "appId": 284882215,
  "appName": "Facebook",
  "bundleId": "com.facebook.Facebook",
  "developer": "Meta Platforms, Inc.",
  "price": 0,
  "formattedPrice": "Free",
  "currency": "USD",
  "rating": 4.52,
  "ratingCount": 26725013,
  "primaryGenre": "Social Networking",
  "genres": ["Social Networking"],
  "contentRating": "12+",
  "version": "565.0.0",
  "minimumOsVersion": "15.1",
  "fileSizeBytes": 473668608,
  "appStoreUrl": "https://apps.apple.com/us/app/facebook/id284882215",
  "artworkUrl": "https://is1-ssl.mzstatic.com/.../512x512bb.jpg",
  "screenshotUrls": ["https://is1-ssl.mzstatic.com/..."],
  "languages": ["EN", "ES", "FR", "DE", "JA"],
  "description": "Where real people propel your curiosity...",
  "releaseDate": "2019-02-05T08:00:00Z",
  "currentVersionReleaseDate": "2026-06-09T08:43:05Z",
  "country": "us",
  "scrapedAt": "2026-06-11T10:00:00.000Z"
}
```

## Pricing

This Actor uses **pay-per-result** pricing:

| Event | Price |
|-------|-------|
| Per app scraped | **$0.002** ($2 / 1,000 apps) |

You are only charged for apps actually returned. Apify platform usage is billed separately by Apify.

## Use cases

- **App Store Optimization (ASO)** - track keyword rankings and competitor metadata
- **Competitor monitoring** - watch ratings, versions, and pricing over time
- **Market research** - analyze genres, pricing models, and developer portfolios
- **App intelligence** - build datasets across categories and storefronts

## How to Scrape the Apple App Store (Step by Step)

1. Click **Try for free** / **Run**.
2. Enter keywords in `searchTerms` (e.g. `photo editor`) or specific numeric app IDs in `appIds`.
3. Choose the `entity` (iPhone, iPad, or Mac apps) and the `country` storefront.
4. Set `maxResultsPerTerm` (start small to test; the App Store caps at 200).
5. Run the Actor, then export results as JSON, CSV, Excel, or HTML, or pull them via the Apify API.

## Tips

- App IDs are the numeric `id` in an App Store URL (e.g. `id284882215`).
- Use `country` to compare the same app across storefronts.
- Pairs well with a Google Play scraper for cross-platform app intelligence.

## Responsible Use

This Actor is intended for lawful collection of publicly available information only. Users are responsible for ensuring their use complies with the source website's terms, robots.txt, applicable privacy laws, including India's DPDP Act, and all local regulations.

Do not use this Actor to collect, store, sell, or misuse personal data without a lawful basis. The Actor author is not responsible for misuse by end users.

## License

Apache-2.0
