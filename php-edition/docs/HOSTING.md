# Shared hosting, updates and recovery

## cPanel

Enable a currently patched PHP 8.3+ using your provider's PHP selector or MultiPHP Manager. Confirm PDO MySQL (or PDO SQLite), GD, Fileinfo, mbstring, OpenSSL and ZIP are enabled. Enable SSL for the domain. Create a dedicated database and database user, and assign the user to that database. Then upload/extract the PHP ZIP with File Manager and visit `/install/`.

## DirectAdmin

Choose a supported PHP version and enable the required extensions using the tools your provider exposes. Create a database and assigned user in MySQL Management if using MariaDB/MySQL. Upload/extract into the domain's document root using File Manager and visit `/install/`. Apache or compatible LiteSpeed must honour `.htaccess`; Nginx-only hosting needs equivalent server rules from the provider.

Both products are hosting control panels: the presence of the panel does not guarantee that every required extension, private directory permission or web-server rule is available. The installer reports the PHP requirements it can check. No root privileges are needed by the CMS.

## Protect the private folder

The installer suggests a private directory alongside the reported document root, for example `/home/ACCOUNT/1ded-private-...`. It must be outside **every** public document root on the account, including addon domains and other hosted sites. Do not put it inside `public_html`, `domains/DOMAIN/public_html`, an uploads folder or the CMS application folder.

Database credentials are in `PRIVATE/config.php`; the application contains only the generated `app/installed.php` location pointer. Media, original uploads, publication snapshots and backup archives are private storage too. Public images are served with fixed MIME types by the front controller. Uploaded original bytes are downloadable only through an authenticated API.

The release ZIP does not contain `app/installed.php` or an installation key. On first opening the installer, it creates `app/INSTALL-KEY.txt`. Read that file through File Manager, not a public URL. The installer deletes the key after successful setup and locks itself.

## Limits and cron

The default media quota is 512 MB combined public-image/original storage. A hosting owner can set `mediaQuotaBytes` in private `config.php` after considering the account's actual disk allowance. Input images are capped at 8 MB and decoded within a memory-aware pixel bound. PHP `upload_max_filesize`, `post_max_size`, `memory_limit` and execution limits still apply. A large backup may exceed your host's limits; restore/test on a separate installation first.

Add `php /absolute/path/to/cms/cron.php` every minute through the panel if you need scheduled publication. Use the provider's matching PHP CLI binary. Web requests do not pretend that cron is running.

## File Manager updates

1. Download a full backup from Updates & backups, confirming the owner password.
2. Keep an off-host copy and the old application ZIP. Confirm that your current PHP/database versions meet the new release requirements.
3. Download the correct **PHP edition** release from a trusted publisher location. Compare its checksum. This checks file integrity, not publisher authenticity.
4. Extract over the existing application files using File Manager. Preserve `app/installed.php`; do not delete the old installation directory. Never overwrite/delete private storage or the database.
5. If required by the host, restart the site's PHP process or clear its opcode cache using the control panel. Sign in and check private previews, media, contact handling and backups before publication.

Signed automatic code updates and general schema migrations are not part of this release. An unsupported database schema is refused rather than silently modified. Do not use a Node release ZIP or Node backup here.

## Recovery without SSH

Open `/recover/` and enter the owner email, private recovery code and new password. The code is single-use: successful recovery revokes the account's sessions, disables a lost MFA factor and shows a replacement code. Store it privately. While signed in, Account & security can rotate the recovery code after confirming the owner password.

If both password and recovery code are lost, the application does not grant access based only on an email address or a public file. A hosting-account recovery/maintenance procedure must be verified separately; use an off-host backup or contact the maintainer. Email password reset is not implemented.

## Two-factor authentication

Set up an offline authenticator in Account & security, confirm a code and save the single-use MFA recovery codes. The private `mfa.key` file must be preserved during code updates. Full backups include it so MFA remains portable. Follow the [account-security guide](ACCOUNT-SECURITY.md); after a restore, review MFA and replace recovery codes.

## Backup restore

Only owner-authenticated, password-confirmed restore is supported. It accepts the PHP backup format, validates archive entries, creates a safety backup, restores data and media, revokes sessions and regenerates the published snapshot. A restored account may have a different password/recovery code from the current account.

A private restore journal tracks file swaps and the database commit. The next dynamic request or cron rolls back uncommitted swaps or finishes a committed restore. Old swap directories are removed only after recovery succeeds; safety ZIPs remain. Persistent disk/permission failures require hosting-account intervention. Preserve the journal and before-restore directories if recovery cannot finish, and never expose or publish them.

## Domain/subfolder moves

Back up first. Keep private storage private in the destination account. The generated `app/installed.php` pointer must refer to the destination private config. Update the `url` in private config to the destination origin/subfolder so origin verification and cron use the correct address; update Website URL in Site settings too. Republish to regenerate canonical URLs, asset prefixes and search URLs. Test the move privately before changing public DNS.

## Production validation still needed

Local tests covered PHP 8.3.36 with SQLite and MariaDB 10.11.19, including subfolder routing with SQLite. Actual cPanel/DirectAdmin deployment, PHP 8.4/8.5, Apache/LiteSpeed host policy variations, independent security review, accessibility, resource exhaustion and interrupted-operation fault testing remain release gates.
