# Start here: 1DED Free CMS 1.0

1DED Free CMS is a small browser-managed CMS for personal and business websites. The PHP edition runs on ordinary compatible cPanel/DirectAdmin hosting. Editing happens in the admin; publishing creates a fixed public snapshot. No paid account, remote font service, npm, Composer, SSH or mandatory external API is needed.

## 1. Choose the right download

Download **1DED-Free-CMS-PHP-v1.0.0.zip** from [GitHub Releases](https://github.com/saeed-siavash/1ded-free-cms/releases/tag/php-v1.0.0). Use the attached PHP package, not GitHub's automatic source-code ZIP: the repository also contains an older separate Node edition. Verify the ZIP against the attached SHA-256 checksum where your tools allow it. A checksum detects corruption, not a compromised download source.

## 2. Prepare your hosting account

You need HTTPS and a patched PHP 8.3+ with PDO MySQL or SQLite, GD, Fileinfo, mbstring, OpenSSL and ZipArchive. Prefer PHP 8.4+ on a new host. Apache 2.4/compatible LiteSpeed must allow the included rewrite/deny rules. Nginx needs a reviewed equivalent configuration; this package does not configure it automatically.

In cPanel, open **MultiPHP Manager / Select PHP Version**, **SSL/TLS Status**, **File Manager**, and **MySQL Database Wizard / Manage My Databases**. In DirectAdmin, use the corresponding **PHP Version / Domain Setup**, **SSL Certificates**, **File Manager**, and **MySQL Management** screens. Labels depend on your provider.

Create a dedicated empty database and database user, assign it to the database and keep those credentials private. Alternatively choose SQLite if the host supplies PDO SQLite. Create or select a private directory outside every public domain root, for example an account-home directory alongside public_html, not inside it. Ask your provider if you cannot create one. Never use permissions 777 as a shortcut.

## 3. Upload and install

1. Back up anything already in the target directory. Prefer a new domain/subfolder for your first installation.
2. Upload the PHP release ZIP in File Manager and extract its contents into the domain document root or chosen subfolder. Include hidden .htaccess files. index.php must be at that location, not accidentally another directory below it.
3. Open https://YOUR-DOMAIN/install/ (or /YOUR-SUBFOLDER/install/).
4. Review hosting checks. In File Manager, read **app/INSTALL-KEY.txt** and paste that key into the installer. It is intentionally inaccessible through the browser.
5. Enter the private-storage path, database choice/details, site name, starter, owner email and a unique password. Use the full account-prefixed database/user names from your hosting panel.
6. Save the one-time **owner emergency recovery code** offline. There is no bundled admin password. The installer locks after completion.
7. Sign in at /admin/. Open **Updates & backups → Hosting health** and review the results. Confirm private storage is also outside addon-domain roots.

## 4. Make the website yours

Open **Templates & design** for the unified library: 15 subject starters and eight themes. Browse all designs in the [template gallery](TEMPLATE-GALLERY.md). Import additional starters as drafts with a unique prefix. Imports add content; they do not erase your existing pages. Theme changes alter appearance; imported starters add structure.

Open **Navigation** to choose header, footer and mega-menu designs and edit shared header/footer entries, destinations, children, descriptions, icons and normal/mega menu behavior. Categories and saved links have their own screens and can be used in navigation and link sections.

Open **Pages** to add or edit a page, post, product, service, project or team profile. Use the section picker to add heroes, text, images, galleries, features, timelines, testimonials, FAQs, calls to action, contact forms, links, collections and pricing tables. Edit titles, text, images and buttons. Drag/reorder controls and hidden sections let you arrange a page. Save and use the private preview before publishing. History and Trash provide recovery for normal editing mistakes.

Every page/product/service can have its own **Pricing** section. Choose one of five layouts and four skins; edit plan names, amounts, periods, badges, feature rows, notes and buttons. These are presentation tables: there is no shopping cart, payment processor, stock system or subscription billing.

Upload authentic images in **Media library** and add descriptive alternative text. Re-encoded public images and private originals are kept separately. Bundled sample artwork is illustrative, not proof of real staff, offices, customers or completed projects. Replace sample claims and images before launch.

## 5. SEO, forms and publishing

Set the correct public HTTPS URL, title, description and identity in **Site settings**. In page SEO, write a useful unique title and description, choose a social image and review noindex settings. **SEO & discovery** flags common issues; inspect links and configure redirects when changing published URLs. Publishing generates canonical URLs, sitemap.xml, robots.txt and local search data. SEO features do not guarantee indexing or ranking.

Contact forms save messages to **Form inbox** on the live PHP installation. Check that inbox regularly: this release does not send automatic email notifications. Do not collect passwords, payment-card data, medical records or other sensitive records through the general contact form. Provide a privacy notice and your retention policy.

Choose **Publish website** when ready. Draft edits do not change the live snapshot until publication. Use **Publishing** for release history, rollback and scheduling. Scheduled publication requires a control-panel cron job running cron.php every minute with your provider's PHP CLI binary. A static export contains the published website without the admin; its forms need a working live endpoint.

## 6. Protect the owner account

In **Account & security**, enable an authenticator app and save the ten one-use MFA recovery codes privately. Setup works through manual key entry; no remote QR service is used. The separate installation owner emergency code is for lost-account recovery at /recover/. Never publish either kind of recovery code. Review active sessions and sign out unused sessions. Add editors only for people who need content access; owner actions such as publication and backups remain restricted. See [account security](ACCOUNT-SECURITY.md).

## 7. Back up and restore

In **Updates & backups**, confirm your owner credentials and download a full backup. Encryption is selected by default. Use a separate long passphrase and save it separately: it cannot be recovered. ZIP filenames stay visible. Keep an off-host copy and test restoration on a separate installation. See [encrypted backups](ENCRYPTED-BACKUPS.md).

Restore uploads a compatible PHP backup, asks for its passphrase if encrypted, validates it and creates a private unencrypted safety backup before replacing data. All sessions are revoked. The account credentials from the restored backup become active. A restore journal allows the next dynamic request or cron to recover an interrupted swap. If recovery fails persistently, preserve all private files, obtain a hosting-level backup and ask your host for help; do not remove the journal or before-restore directories manually.

## 8. Update without losing uploads

1. Read the new release notes. Download the **PHP edition** package only.
2. Download a full encrypted backup and keep an off-host copy. Also preserve your hosting database and private directory. Test on a copy first where possible.
3. Use maintenance/password protection in the hosting control panel during replacement. Do not let visitors execute a half-uploaded code version.
4. Extract the new code over the existing application files. **Preserve app/installed.php, the entire external private directory, and the database.** Do not delete the existing installation first. Release ZIPs never contain installed.php, so a normal overwrite preserves that pointer.
5. Reopen /admin/, check the reported version and Hosting health, preview pages, submit a harmless contact message and publish a test change. Remove host-level maintenance protection after verification.

Images, originals, accounts, drafts and backups live in the external private directory/database. They are not stored inside replaceable template files. Keep a copy of app/installed.php securely: it locates your private configuration. PHP 0.1–0.4 installations use the same schema 1 and can upgrade to 1.0 through this procedure. The Node edition has a different data/password format and needs a separately reviewed migration; never point PHP at Node storage.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| 500 immediately after upload | PHP error log, PHP version/extensions, AllowOverride and supported .htaccess directives; ask the host |
| Pages except homepage return 404 | Hidden .htaccess was extracted, rewrite support is active, and subfolder installation path is correct |
| Database connection fails | Full prefixed database/user names, assigned permissions, host and port |
| Installer says storage is public/unwritable | Correct external account-home path and ownership; do not use 777 |
| HTTPS redirect/proxy problem | Ask the provider to report HTTPS correctly to PHP; forwarding headers are not blindly trusted |
| Backup upload rejected | Hosting upload_max_filesize/post_max_size, CMS 128 MB archive / 512 MB expanded / 32 MB entry limits, correct passphrase and PHP edition |
| MFA code rejected | Automatic phone/server time, fresh unused code, or one-use recovery code |
| Scheduled publish waits | Correct PHP CLI binary/path and a running control-panel cron job |
| No email after contact submission | Messages are in Form inbox; automatic email notifications are not included |

For a public launch, verify your real domain, mobile/keyboard navigation, contact inbox, recovery codes and a test restore. Keep the host patched. Read [security](../SECURITY.md) and [hosting details](HOSTING.md). No independent security certification or real-host deployment test is claimed.

