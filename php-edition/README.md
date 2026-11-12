# 1DED Free CMS — PHP Edition

**Self-hosted, dependency-free CMS for ordinary shared hosting. Version 1.0.0.**

Upload a ZIP, open the browser installer, choose a template and create your owner account. No Node.js, npm, Composer, Docker, SSH or external account is required to run this edition.

## Hosting requirements

- A currently patched **PHP 8.3 or newer**. PHP 8.4+ is recommended for a new installation.
- **MySQL 8+ / MariaDB 10.6+** with PDO MySQL, or PDO SQLite for a database-free setup.
- PHP **GD, Fileinfo, mbstring, OpenSSL, JSON, sessions and ZipArchive**.
- HTTPS, writable private storage, and Apache 2.4 or compatible LiteSpeed with the included `.htaccess` rules enabled. Nginx requires equivalent deny/rewrite configuration; do not upload this package to an unconfigured Nginx document root.
- Ability to create a directory **outside every public website root**, such as an account-home private folder.

Select the PHP version/extensions through cPanel or DirectAdmin where your provider permits it. If a requirement is unavailable, ask your provider to enable it. This package cannot change hosting-server configuration itself.

## Install through cPanel or DirectAdmin

1. Enable HTTPS for the domain and select a supported PHP version.
2. Download the **PHP edition** ZIP, upload it with File Manager and extract it into `public_html`, the domain document root, or a subfolder. Include hidden `.htaccess` files. Do not use the Node edition ZIP.
3. If using MySQL/MariaDB, create a dedicated database and user in the control panel, then assign that user to the database with the permissions needed to create/update the CMS tables. Include the account prefix in both names.
4. Open `https://your-domain.example/install/` (or `/subfolder/install/`). Review the hosting checks.
5. Open **`app/INSTALL-KEY.txt` in File Manager** and paste its contents into the installer. This proves access to the hosting files; the key is blocked from browser access.
6. Choose a private storage directory outside all public roots. The suggested path is outside the server's reported document root; verify that it is also outside addon-domain roots.
7. Enter the database details, website name, template, owner email and a password. Choose SQLite if available and you do not want a database account.
8. Save the **one-time owner recovery code** privately. Installation then locks itself.
9. Sign in at `/admin/`, replace example content and images, and publish.

The installer does not create a default account/password. Do not expose an unfinished installation unnecessarily; keep the File Manager key private.

## Included

- Browser owner/editor admin, password changes, per-account authenticator MFA, single-use MFA recovery codes, active-session controls and owner emergency recovery without SSH.
- Fifteen subject starters and eight visual themes in one searchable library, with locally bundled illustrative imagery.
- Five header designs, five footer designs and four mega-menu styles.
- Thirteen page-section types, including independent product/service pricing: five layouts, four colour styles, editable plans, features, highlights, billing notes and buttons.
- Pages, posts, products, services, projects, team-member content, categories, tags, saved links, private previews and additive template imports.
- Autosave, revision conflicts, page history, recoverable trash, publication snapshots and rollback.
- Contact inbox, local search, metadata, canonical URLs, sitemap, robots.txt and redirects.
- Decoded/re-encoded public images, privately preserved uploaded originals, image descriptions and optional browser optimization.
- Owner hosting health panel: extension/storage checks, MFA coverage, local backup freshness, publication status and local release-file integrity.
- Full browser backup/restore with optional AES-256 password-encrypted ZIPs, owner verification, safety backup and session revocation.
- Static website ZIP export, with draft media and admin code excluded. Exported contact forms need a live endpoint.
- Root-domain and subfolder routing; scheduled publication through control-panel cron.

## Backups and safe updates

Use **Updates & backups** to confirm your owner password and download a full ZIP. The browser defaults to an AES-256 encrypted ZIP with a separate 12–256 byte passphrase and confirmation. Save that passphrase separately: it cannot be recovered. ZIP entry names are visible; file contents are encrypted. Unencrypted ZIPs remain available for compatibility. Restore accepts either format. On-server safety backups remain unencrypted in private storage. The backup includes accounts, recovery-code hashes, messages, drafts, histories and original images, so treat it as private. Database connection credentials and active sessions are excluded. Restore accepts only this edition's constrained backup format; it validates paths and content, creates a safety backup and signs everyone out.

For this release, **code updates are manual through File Manager**: back up first, obtain the correct PHP release, verify the published checksum, then extract over the application files. Preserve `app/installed.php`, the private storage folder and the database. Do not delete the installation folder before extracting. Credentials and media live outside the replaceable application files. A checksum detects corruption; it does not authenticate a malicious replacement. Signed browser code updates are not implemented.

The Node edition remains separate. Its database/password format and full backups are **not** directly interchangeable with this PHP edition. A reviewed migration tool is still needed; never point this edition at the Node data folder.

## Scheduling

Add a control-panel cron job every minute, using the PHP CLI binary matching your site's selected PHP version:

```text
php /home/ACCOUNT/public_html/cron.php
```

Substitute the actual PHP binary and installation path supplied by your provider. A missing cron does not affect ordinary editing or manual publishing; scheduled publication waits until cron runs.

## Verification and limits

Integration tests ran locally on **PHP 8.3.36 with SQLite and MariaDB 10.11.19**, exercising installation, auth/roles, previews, pricing, editing conflicts, publication isolation, exports, template imports, image decoding/original preservation, backups/restores, invalid backups, code replacement, MFA enrollment/replay/recovery and portable MFA backups. A SQLite subfolder installation was also tested. These are development checks, **not an independent security audit or a test on your hosting account**.

Restore uses a private recovery journal: the next dynamic request or cron run rolls back uncommitted file swaps or completes a committed restoration. Six simulated interruption boundaries are covered by tests. This is not a guarantee against disk corruption, storage failure or provider misconfiguration. Independent security review, passkeys, signed updates, email notifications, broader accessibility/load testing and real cPanel/DirectAdmin deployment validation remain future work. No production-security certification is claimed.

Start with the [complete user guide](docs/USER-GUIDE.md), [all 23 template previews](docs/TEMPLATE-GALLERY.md), and [project introduction](docs/INTRODUCING-1DED-FREE-CMS.md).

See [encrypted backups](docs/ENCRYPTED-BACKUPS.md), [hosting health checks](docs/HOSTING-HEALTH.md), [account security and MFA](docs/ACCOUNT-SECURITY.md), [SECURITY.md](SECURITY.md), [hosting and recovery](docs/HOSTING.md), and [developer testing](docs/TESTING.md).

MIT licensed. Bundled AI-generated sample artwork is illustrative, not evidence of actual people, premises, clients or projects. Replace it with authentic owner content where appropriate.
