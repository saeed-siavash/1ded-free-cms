# Security policy — PHP edition 1.0

This edition is not independently audited or certified for production. Use a currently patched PHP/database stack and deploy only in the documented hosting configuration.

## Implemented controls

- File Manager installation key and per-session installation nonce; locked reinstallation; HTTPS enforced outside loopback development.
- Database credentials, session records, messages, backups and uploaded originals outside the public document root.
- Prepared PDO statements, validated content, escaped HTML, constrained URL schemes and fixed image paths.
- PHP password hashing (Argon2id when available, otherwise PHP's default password algorithm), random hashed session tokens, expiry, HttpOnly/SameSite cookies, Secure cookies on HTTPS and session revocation.
- Optional RFC 6238-compatible TOTP MFA, enrollment confirmation, replay prevention, one-use MFA recovery codes and fresh-factor checks for sensitive actions.
- Authenticator setup keys encrypted with AES-256-GCM using a separate private-storage key. Session listing/revocation is restricted to the signed-in account.
- Same-origin and CSRF checks for authenticated writes; owner-only publication, account management, backup/restore and health access.
- Persistent bounded rate-limit records for login, recovery, contact forms and sensitive reauthentication.
- Public images decoded and re-encoded with GD; MIME/pixel bounds; 8 MB input maximum; original source bytes kept privately. Default combined media quota is 512 MB.
- Backup path/entry/expanded-size validation, fresh password confirmation, one-time download grants, safety backups and session revocation on restore.
- Atomic publication-file creation before moving the database's current-publication pointer.

## Important limits

Signed browser updates and phishing-resistant passkeys are not implemented. TOTP MFA is available but does not resist real-time phishing. The ZIP checksum is not publisher authentication. Backups are sensitive; portable MFA backups include the private authenticator encryption key. Downloaded backups can use AES-256 ZIP encryption. Plain backups and automatic safety backups are unencrypted. Protect them as account credentials. Restore uses a transaction marker, private journal and request locks to recover interrupted file swaps. Retain off-host copies and test recovery; disk corruption and persistent storage failures still require operator intervention. Disk exhaustion, multi-worker interruption and proxy/TLS edge cases need more fault-injection testing. The built-in PHP development server is not a production web server.

See [the MFA and recovery guide](docs/ACCOUNT-SECURITY.md), including the difference between MFA recovery codes and the owner emergency recovery code.

Do not trust forwarding headers by default. Shared-hosting HTTPS must be reported correctly by the PHP/web-server configuration. The installer can verify only its reported document root; the owner must keep private storage outside **all** domain roots on the account. Apache/LiteSpeed `.htaccess` protection must remain effective.

Do not submit medical records, payment-card details or other sensitive records through the general contact form. Pricing tables do not process payments.

Report vulnerabilities privately to the maintainer through the project's private reporting channel when available; do not post credentials, recovery codes, customer data or exploit-ready installation details in a public issue.

## Encrypted backup scope

PHP 1.0 offers AES-256 ZIP content encryption through libzip, with a separate passphrase supplied only for the request. Filenames remain visible. The automatic pre-restore safety ZIP remains unencrypted inside private storage. Live database/media encryption and protection against disk corruption are outside this feature. See docs/ENCRYPTED-BACKUPS.md.

## Supported releases and reporting

Security fixes target the latest PHP 1.x release. Upgrade to the latest patch in that series. The older Node edition is a separate preview and is not covered by the PHP release’s test results.

Report privately using GitHub Security Advisories if enabled: https://github.com/saeed-siavash/1ded-free-cms/security/advisories/new . If unavailable, contact the maintainer through the public GitHub profile and request a private channel before sharing details. Never post credentials or customer data in public issues. No response-time SLA is promised.
