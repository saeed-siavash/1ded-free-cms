# Two-factor authentication and session controls

PHP edition 0.2.0 adds optional, per-account authenticator-based MFA. It works offline with compatible TOTP apps and does not send your setup key to a QR-code service, SMS provider or cloud account.

## Enable MFA

1. Sign in and open **Account & security**.
2. Under Two-factor authentication, confirm your current password and choose **Set up authenticator app**.
3. In your authenticator, choose manual setup / enter a setup key. Enter the displayed key, your account email, issuer **1DED Free CMS**, time-based codes, six digits and a 30-second period. The algorithm is SHA-1, as used by common TOTP apps.
4. Enter a current six-digit code and confirm. Setup expires after ten minutes; MFA stays off until confirmation succeeds.
5. Save the ten MFA recovery codes privately. They are shown once and each can be used once. Other account sessions are signed out after confirmation.

No QR image is generated in this release. Manual entry avoids a required QR dependency or a remote service. The setup key is an authentication credential: do not send it in screenshots, issues, messages or support requests.

## Sign in

Enter your email/password first, then a current authenticator code or unused MFA recovery code. The second-step challenge lasts five minutes and permits at most five attempts, with additional IP/account rate limits. A password alone does not issue a session when MFA is enabled.

Authenticator codes are accepted within one 30-second clock step of the server and cannot be reused after successful verification. If you just used a code to enable MFA or authorize an action, wait for the next code or use an unused recovery code. Set your phone to automatic time and ask the host to check its server clock if codes consistently fail.

TOTP helps protect against stolen passwords but is not phishing-resistant. Only enter your password and codes on your own site's correct HTTPS address. Passkeys/WebAuthn are not implemented.

## Sensitive actions

With MFA enabled, password changes, full-backup grants, backup restoration, owner emergency-code rotation, MFA recovery-code replacement and disabling MFA require a fresh authenticator or unused MFA recovery code in addition to the current password. MFA recovery codes are consumed when successfully verified, including for these actions.

You can replace the entire MFA recovery-code set in Account & security. Old unused codes stop working. Disabling MFA requires password and factor verification and revokes other account sessions.

## Two different kinds of recovery code

- **MFA recovery codes:** ten single-use codes that replace the authenticator step. Your password is still required to sign in.
- **Owner emergency recovery code:** the separate long code saved at installation or rotated in Account & security. At `/recover/`, it lets the owner reset a forgotten password **and disable a lost MFA factor**. It rotates after successful use and revokes the account's sessions. It is a break-glass owner credential, not an email-based reset.

Keep these separately and privately. An attacker with the owner emergency code and owner email can recover the account. Editors do not receive the owner's emergency recovery capability; an owner must handle a locked-out editor through account administration.

## Active sessions

Account & security lists your own active sessions, their expiry, and which is current. You can sign out one other session or all other sessions. It does not invent device names or expose other accounts' session records. Sessions expire after eight hours; new sign-ins retain at most ten sessions per account.

## Backups and encryption keys

Authenticator setup keys are encrypted in database records using AES-256-GCM. The encryption key lives in private storage as `mfa.key`, outside the public web root. MFA recovery codes are stored only as SHA-256 hashes of cryptographically random 128-bit codes. Active login challenges and incomplete enrollments are omitted from full backups.

**Full backups are highly sensitive; select AES-256 encryption for downloads.** To make MFA portable, the backup includes the private encryption key alongside encrypted MFA records. Anyone obtaining a plain ZIP—or an encrypted ZIP and its passphrase—can recover authenticator secrets. Store off-host backups securely and do not upload them to a public issue or website folder. Database-only copies without the matching key cannot restore MFA correctly.

Restoration revokes sessions and restores the backed-up account/security state. Previously consumed recovery codes may become valid again if they were unused when that backup was made. After a restore, review MFA, replace MFA recovery codes, rotate the owner emergency code and check active sessions. If a backup was exposed, also change the password and replace the authenticator setup.

Backups from PHP 0.1.0 have no MFA configuration; restoring one restores that earlier password-only state. Node-edition backups remain incompatible. A private journal coordinates interrupted restores; retain an off-host safety copy for storage failures and operator mistakes.

## Scope of verification

Tests cover the [RFC 6238](https://www.rfc-editor.org/rfc/rfc6238) SHA-1 vectors, enrollment, session gating, replay rejection, one-use recovery codes, code replacement, factor-protected actions, emergency recovery and portable backups. These controls follow the general concerns described by the [OWASP MFA guidance](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html); this is not a claim of independent verification or compliance.
