# Developer verification

End users need only PHP/shared hosting. The integration-test harness uses Node.js 24+ to start isolated PHP servers, drive HTTP requests, check responses and remove its own temporary fixtures.

```text
php -l index.php
php tests/totp-vectors.php
node --test tests/integration.mjs
```

Set `PHP_BIN` if `php` is not on PATH. `PHP_TEST_FLAGS` can contain a JSON array of PHP CLI arguments needed to enable installed extensions. On the Windows development runtime used for this release:

```powershell
$env:PHP_BIN = 'C:\path\to\php.exe'
$env:PHP_TEST_FLAGS = '["-d","extension=php_pdo_sqlite.dll","-d","extension=php_gd.dll"]'
node --test tests/integration.mjs
```

For a **dedicated disposable MariaDB database**, set `CMS_TEST_DB=mysql`, `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, and `MYSQL_PASSWORD`. Never run the integration suite against an existing CMS or a production database. The installer deliberately refuses a database already containing owner accounts. The current MariaDB test uses one installation; subfolder integration is separately exercised with SQLite.

The suite checks:

- File Manager installation-key protection, browser nonce and locked reinstallation.
- Authentication, owner/editor boundaries, CSRF and Origin checks.
- All 15 subject previews, eight visual themes through the shared renderer, and navigation design previews.
- Product pricing, revisions/conflicts, page references and history.
- Static publication isolation, local assets, exports and sitemap generation.
- Additive draft imports and unpublished-route privacy.
- GD image decoding, protected uploaded originals, full backup/restore and session revocation.
- Invalid-backup rejection and application-file replacement preserving config/data.
- Owner-code recovery/rotation and SQLite subfolder routing.
- MFA enrollment, encrypted setup keys, second-step session gating, OTP/recovery-code replay rejection, code replacement, session scoping and factor-protected actions.
- MFA-aware emergency recovery and restoring a backup into a different private encryption-key context.

`tests/totp-vectors.php` independently checks the published RFC 6238 SHA-1 vectors and Base32 encoding.

The test-generated accounts and prices are fixtures, not installation defaults. Temporary PHP copies, database files and credentials must never be placed in a release archive. Passing tests do not establish production security or replace a real hosting-account deployment test.

Hosting-health regression coverage checks owner/editor/anonymous access, private-path omission, normal and changed file hashes, and rejection of traversal manifests.

The restore-recovery fixture simulates six filesystem/commit interruption boundaries, checks repeated recovery, restores the prior MFA key before commit and verifies publication regeneration after commit. It runs inside the main disposable installation on SQLite/MariaDB. This models interruption states; it is not a disk-corruption or real hosting test.
