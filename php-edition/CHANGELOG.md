# PHP edition changelog

## 1.0.0-php — 2026-11-12

- First numbered PHP 1.0 release for the documented shared-hosting profile.
- Added a restore journal and transaction marker for automatic rollback/completion after interrupted file swaps. Dynamic readers now coordinate with writes through shared/exclusive locks; cron also performs recovery.
- Added tests for six interruption boundaries, repeated recovery and publication regeneration on SQLite and MariaDB.
- Added referrer, permissions and HTTPS transport response headers.
- Published the complete no-SSH user guide, update/recovery instructions, feature article and unified 23-design screenshot gallery.
- Preserved schema 1 and upgrade compatibility with PHP 0.1–0.4 data. No independent audit, real-host validation or signed automatic update claim is made.

## 0.4.0-php-beta — 2026-11-12

- Added AES-256 ZIP encryption for every full-backup entry using the host’s libzip implementation.
- Added a separate, confirmed backup passphrase; download requests use authenticated POST and never persist the passphrase.
- Added encrypted restore with early passphrase verification before the current data is replaced, while retaining support for plain backups.
- Added round-trip, encryption-header, wrong-passphrase, unchanged-data and session-revocation regression checks.
- Backup filenames remain visible, and automatic pre-restore safety backups remain plain ZIPs in private storage. Schema stays at 1.

## 0.3.0-php-beta — 2026-11-12

- Added an owner-only Hosting health panel inside Updates & backups, with refresh and readable remediation guidance.
- Added PHP/extensions, reported web-root separation, writable storage, HTTPS, local full-backup freshness, owner MFA coverage and publication checks.
- Added local release-manifest verification, including changed/missing file lists and constrained manifest paths. No update-server requests or absolute storage paths are included.
- Added authorization, modified-file and malicious-manifest regression coverage. Local checks do not authenticate release publishers or certify hosting security.
- No data schema changes; existing private storage, uploads and account settings are preserved.

## 0.2.0-php-beta — 2026-11-12

- Added optional per-account authenticator MFA with confirmed enrollment, encrypted secrets, replay checks and single-use recovery codes.
- Added password-first, factor-second login challenges; no session is issued before the factor succeeds.
- Added fresh-factor checks for password changes, backup grants/restoration, owner-code rotation and MFA settings.
- Added account-scoped session lists, individual revocation, sign-out of other sessions and a ten-session cap.
- Preserved owner emergency recovery for lost MFA and made MFA portable through full backups.
- Added RFC 6238 vectors and integration tests for replay prevention, session boundaries, MFA recovery, backup key restoration and disabling protection.
- Kept database schema 1 and compatibility with existing PHP installations/backups. Remains a beta without independent security certification or signed automatic updates.


## 0.1.0-php-beta — 2026-11-12

- Added a PHP-only shared-hosting runtime with PDO MySQL/MariaDB and SQLite drivers.
- Added a File Manager/browser installer, private storage outside the web root and locked reinstallation.
- Reused the 15 subject packs, eight themes, local images, unified admin, header/footer/mega-menu choices and per-page pricing tables.
- Added content editing, categories/links, history/trash, publication snapshots, rollback and static export.
- Added decoded public images with privately preserved originals, owner/editor permissions, origin/CSRF checks and persistent throttling.
- Added password-confirmed browser backups/restores and browser owner-code recovery without SSH.
- Added root/subfolder routing, local search, metadata and control-panel cron publication.
- Verified integration suites on PHP 8.3.36 with SQLite and MariaDB 10.11.19.
- Remains a beta; not independently audited, not yet tested on real cPanel/DirectAdmin accounts, and no signed automatic updates or MFA are claimed.
