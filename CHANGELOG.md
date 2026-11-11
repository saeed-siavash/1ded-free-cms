# Changelog

## 0.4.1 — 2026-11-11

- Prepared the first public GitHub presentation with an illustrated README, a full introductory article, and a browsable gallery.
- Added actual screenshots for all 15 subject starters and eight visual themes.
- Preserved the detailed user guide and documented the production release-readiness roadmap.
- Completed temporary backup cleanup before sending the download response, avoiding a shutdown race on Windows, with bounded retries for temporary file locks.
- The application remains a beta and no independent security certification is claimed.


## 0.4.0 — 2026-11-11

- Added 15 subject packs: Web Hosting, Cloud Hosting, Food, Doctor, Engineer, Business Card, Biography, Resume, Music, Artist, IT, Company, Journal, Press, and Blog.
- Added a searchable/filterable owner template library, authenticated multi-page previews, and installer subject selection.
- Added transactional draft imports into unique folders, optional menu groups, appearance opt-in, and bulk publication eligibility for imported pages.
- Added editable page layouts and automatic content-collection sections.
- Added purpose-specific tables, timelines, galleries, categories, and sample article structures.
- Improved private preview links, draft navigation privacy, full-width text/table layout, and empty gallery placeholders.
- Added complete pack validation, setup/import/preview/permission tests, and standalone export checks.
- Remains a beta: specialist back-office systems and production security hardening are not included in this content/template update.


## 0.3.0 — 2026-11-11

- Added Coast, Bloom, Citrus, and Lavender: eight lightweight locally bundled templates in total.
- Added private previews using existing content and optional recommended palettes.
- Added explicit normal/mega navigation defaults, per-group overrides, and 2–4 columns.
- Added menu icons, descriptions, category destinations, button links, new-tab/nofollow settings, duplication, and ordering.
- Added sticky-header, menu-alignment, and website-search controls.
- Improved mobile disclosures, outside-click closing, and readable button text for custom accents.
- Added template/navigation permission, preservation, preview, and asset-budget tests.
- This release remains a beta; the security hardening and independent review discussed for production release are not completed by these template changes.


## 0.2.0 — 2026-11-11

- Added shared categories, tags, content-type filtering, category archives, and a public blog index.
- Added categorized saved links, page-reference buttons, internal link/orphan checks, and local static search.
- Added a text-formatting toolbar, page autosave, retained history, and recoverable trash.
- Added original-preserving local image resizing/WebP optimization and media metadata/search.
- Added scheduled publication with interrupted-job retry.
- Added full backup downloads and validated restoration with a safety backup.
- Added an offline release updater, per-file manifest hashes, version checks, code/data backups, and schema migration backups.
- Tested legacy account/content preservation, unchanged upload bytes and .env, bad archive rejection, and full ZIP backup recovery.
- Browser-verified category/link creation, categorized content autosave/history, image optimization, and original download access.


## 0.1.0 — 2026-11-11

First public beta of 1DED Free CMS.

Includes installation, owner/editor accounts, structured page editing, shared navigation and footer, four themes, media uploads, a contact inbox, SEO output, static snapshot publishing, rollback, ZIP export, and backup/recovery tools. Stale page and settings saves are rejected rather than silently overwriting newer edits.

Verified on Windows with Node.js 24.22.1 using the Node test runner and browser checks for installation, sign-in, page editing/saving, publishing, and desktop/mobile dashboard layout. Source archive extraction and tests are checked before delivery. Docker and Linux deployment configurations are supplied but not executed in this environment.

Known first-release boundaries are documented in README.md. No independent security audit has been performed.
