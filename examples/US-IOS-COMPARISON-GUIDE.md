# US iOS competitor research: CSV comparison guide

Use this guide to turn Apple App Store snapshots into a client research table. The Actor returns factual metadata for known app IDs; the spreadsheet comparison is performed downstream.

[Open the three-app US starter](https://apify.com/fascinating_lentil/apple-app-store-scraper/examples/us-ios-competitor-research). Its illustrative apps are Notion (`1232780281`), Evernote (`281796108`) and Microsoft OneNote (`410395246`). Substitute a client's app and two relevant competitors. The starter uses `country: "us"`, `maxResults: 3`, no proxy and no schedule. The configuration is locally validated, not a newly run cloud sample.

## Collect comparable files

1. Keep the same app IDs and storefront for both observations. Set `maxResults` high enough to include all selected IDs, up to the existing maximum of 50.
2. Check `RUN_STATUS`. Record the outcome and the requested, saved, failed and not-found counters with each export. A partial or empty result is not proof that a missing competitor has been delisted.
3. Export CSV using all dataset fields. A display view may omit numeric `price` or `currency`; include them explicitly in your comparison export.
4. Save dated baseline and current files. Preserve the original snapshots rather than overwriting them.
5. Import `appId`, `bundleId` and `version` as text. Spreadsheet number conversion can damage identifiers or version strings.
6. Join baseline and current rows on `appId` plus `country`. Keep unmatched rows visible as unobserved in that snapshot; do not fill their measurements with zero.

## Field rules for the client table

| Comparison | Export fields | Rule |
| --- | --- | --- |
| Stable identity | `appId`, `country`, `bundleId`, `appName`, `developer`, `appStoreUrl` | Join on `appId` + `country`; show the current name, developer and official listing URL. |
| Aggregate rating | `rating` | Current minus baseline gives a change in rating points, such as 4.6 to 4.7 = +0.1 points. Compare only two present numeric values. |
| Rating count | `ratingCount` | Current minus baseline gives net change in the observed aggregate count. It is not downloads, users or an exact count of new review text. |
| Current-version aggregates | `ratingCurrentVersion`, `ratingCountCurrentVersion`, `version` | Keep these separate from all-version aggregates. After a version change, do not interpret a reset as lost ratings or compare it as the same cohort. |
| App version | `version` | Compare complete strings for equality. Do not subtract versions or sort them as decimal numbers. |
| Release timing | `currentVersionReleaseDate`, `releaseDate`, `scrapedAt` | Keep the version release date separate from the collection date and initial app release date. Source publication and lookup refresh can differ. |
| Download price | `price`, `currency`, `priceText`, `isFree` | Compare numeric `price` only for the same storefront and currency. Zero is a valid free download; null is unknown. Ignore percentage change when baseline price is zero. |
| Compatibility | `minimumOsVersion`, `contentRating`, `fileSizeBytes` | Describe observed requirements; do not infer device-level compatibility or performance from these fields. |

The lookup price is the listed download price. It does not include subscription plans, in-app purchases, taxes or a customer's personalized offer. A free download can still sell subscriptions.

## Suggested report columns

Create a table with app name, ID, US storefront, baseline and current collection dates, current rating, rating-point change, current rating count, net count change, old and current version, version-changed flag, current-version release date, old and current download price, currency, and official listing URL. Keep each calculated column alongside the original observed values.

Only compute a comparison when both snapshots contain the required values. Use “not comparable” for missing values, currency mismatches or a changed storefront. Confirm unexpected changes against the official listing before using them in a client recommendation.

## Repeat use

Save the same configuration for the client's review cadence. Each repeat is another charged Actor run under the displayed pricing. At the current listed rate, three saved app rows are `$0.006` plus the start event. The starter does not automatically run on a schedule.

History, joining, calculated changes and alerts belong to your spreadsheet or chosen downstream workflow. The Actor does not supply a persistent monitor, generated comparison report, keyword discovery, ranks, review text, downloads, revenue or a US audience demographic. It is independent of Apple; follow the source-use notes in the [README](../README.md).
