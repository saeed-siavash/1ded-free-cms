# 1DED Free CMS 1.0 — PHP edition

The first PHP 1.0 release provides a browser CMS for compatible cPanel/DirectAdmin hosting, without Node.js, Composer or SSH at runtime.

Download **1DED-Free-CMS-PHP-v1.0.0.zip**, not the automatic repository source archive. Verify its SHA-256 file, extract it including hidden .htaccess files, open /install/, read the File Manager installation key, choose private storage outside public roots and create your owner account. There is no default password.

Included: 15 subject starters, eight themes, five headers, five footers, four mega menus, 13 section types, independent page/product pricing, categories, saved links, image library with private originals, SEO, local search, form inbox, snapshots/rollback, cron scheduling, static export, owner/editor roles, MFA, session management, encrypted backups and journal-assisted restore recovery.

**[Complete user guide](https://github.com/saeed-siavash/1ded-free-cms/blob/main/php-edition/docs/USER-GUIDE.md)** · **[All template screenshots](https://github.com/saeed-siavash/1ded-free-cms/blob/main/php-edition/docs/TEMPLATE-GALLERY.md)** · **[Full feature article](https://github.com/saeed-siavash/1ded-free-cms/blob/main/php-edition/docs/INTRODUCING-1DED-FREE-CMS.md)**

Updates from PHP 0.1–0.4 preserve schema 1: back up, protect the site during replacement, extract code over existing files and preserve app/installed.php, the external private directory and database. Node data/backups are incompatible; the older Node edition is not part of this stable release.

Checks cover SQLite and MariaDB on PHP 8.3.36, RFC authentication vectors, auth/roles, snapshots, MFA, encrypted backups and six simulated interrupted-restore states. GitHub CI adds PHP 8.3/8.4. No independent audit or real cPanel/DirectAdmin validation is claimed. Signed automatic updates, passkeys and email notifications remain future work. Backups use optional AES-256 content encryption; filenames are visible and automatic safety backups remain plain in private storage. Use currently patched hosting software, enable MFA, keep off-host backups and test recovery.

MIT licensed. Sample artwork and content are illustrative. Read the [security policy](https://github.com/saeed-siavash/1ded-free-cms/blob/main/php-edition/SECURITY.md) before deploying.
