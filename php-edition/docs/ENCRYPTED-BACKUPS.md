# Encrypted full backups

In **Updates & backups**, choose **Password-encrypted ZIP**, enter your current owner password and, when enabled, a fresh authenticator or recovery code. Enter and confirm a separate backup passphrase of 12–256 bytes. The CMS rejects your current account password as the backup passphrase. Save the passphrase in a password manager or another safe place separate from the archive.

The passphrase is sent over the authenticated connection to create the archive; it is not stored in the database, tickets, audit log or backup metadata. Public installations require HTTPS. Passphrases cannot be recovered or reset for an existing archive. Choose a long, unique passphrase: archive encryption does not make weak passwords safe against offline guessing.

## Protection and compatibility

The CMS uses PHP ZipArchive/libzip AES-256 ZIP encryption for every entry. The host must support creating AES-256 ZIP archives; unsupported hosts receive an error and no plain fallback is silently downloaded. Standard ZIP filenames and archive size are visible. Contents—including accounts, MFA keys, message data and original images—are encrypted. Use a ZIP utility with AES ZIP support if opening the archive outside the CMS; some built-in operating-system extractors do not support it.

Choose **Unencrypted ZIP** only when you need a plain compatible archive and can keep it private. Existing plain PHP-edition backups still restore normally. These options do not make Node-edition backups compatible.

## Restore

Upload the backup ZIP, enter its backup passphrase when encrypted, and confirm your current owner credentials. A wrong passphrase is rejected before a safety backup or data replacement. A valid archive must still pass the existing path, size, content and account validation. Successful restoration signs everyone out. Log in using the restored account credentials.

Full backups created here remain in the private on-server backups directory. Encrypted downloads remain encrypted there. Automatic safety backups created during restore are **unencrypted** and contain the previous installation data. Account data and images in the live private directory are also not encrypted at rest by this feature. Restrict hosting access and retain off-host backups; server compromise can expose live data.

Encryption does not authenticate the release publisher or replace testing restoration on a separate installation. A private journal and database transaction marker coordinate interrupted restores. Persistent storage failures still need operator recovery.
