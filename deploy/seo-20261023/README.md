# RadioKlad SEO release — 23 October 2026

This release implements the canonical, metadata and redirect specifications for radio-klad.ru.

- 280 public pages have explicit Title, Description and visible H1 text.
- Product Title is independently editable in the existing admin form; seoH1 and seoDescription retain their existing fields.
- 26 linked category aliases and other wrong-category product paths redirect to the real category. Internal product links use that category as well.
- Native URL serialization prevents trailing-slash redirect loops. GET/HEAD normalization excludes admin, API, upload, framework and file requests.
- The nginx map normalizes the current public catalog, repeated slashes, www and HTTP in one hop, preserving query parameters. Unknown/new products fall back to database-backed application routing.
- Six similarly named products are distinguished using their recorded short descriptions. The photographed 14-pin chip no longer has a contradictory 16-pin description.

## Data and deployment

The schema addition is in prisma/migrations/20261023180000_product_seo_title. The product metadata payload records both the expected pre-change values and replacement values. Deployment checks those values before modifying a row, takes a full database backup and validates a private release on a cloned database. Existing prices, contact settings, photographs and the original DragSoyuz store are protected by hashes and container identity checks.

The dated deployment script and nginx configuration are a record of this specific release, not a generic installation command. Do not run them against an unrelated environment. The deployment script includes rollback to the preceding release and reversal of the scoped metadata changes.

The source includes the preceding contact/Jivo commit 75e1210. No unpublished catalog-content edits from the separate working directory are included.

## Verification

Next.js production build and TypeScript checks; regression tests in src/lib/seo-routing.test.ts; authenticated preview save of a separate Title without changing H1; desktop/mobile visual inspection; full HTML checks for 280 URLs, 26 alias redirects, missing-page 404s and GET/HEAD redirect scenarios.
