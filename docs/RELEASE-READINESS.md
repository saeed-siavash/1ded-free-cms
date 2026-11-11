# Public beta and release-readiness roadmap

1DED Free CMS v0.4.1 is a public beta for evaluation, development, and carefully managed pilots. Publishing the source and screenshots does not certify the application for broad production use.

## Current verification

- Eighteen automated tests cover content validation, authentication flows, owner/editor permissions, CSRF/origin checks, draft isolation, publication, rollback, forms, redirects, exports, full-backup restoration, legacy migration, update preservation, subject imports, and previews.
- Browser checks exercised template selection, menus, page editing, image optimization, subject imports, preview navigation, and representative mobile layouts.
- All 15 subject starters and eight visual themes have actual screenshots in the repository.
- Docker configuration is supplied, but Docker execution and broad Linux production deployment testing were not performed in the initial Windows development environment.

## Security work before a stable production release

| Area | Remaining work |
| --- | --- |
| Trusted releases | Signed release verification, trusted-key rotation/revocation, authenticated metadata |
| Accounts | Local MFA and recovery codes, active-session controls, fresh authentication for sensitive actions |
| Passwords | Explicit, benchmarked, versioned hashing parameters and upgrades of older hashes |
| Production configuration | Stronger startup checks for public origin, HTTPS deployment assumptions, and secure cookies |
| Uploads | Deeper server-side image validation, pixel/decompression bounds, and controlled public derivatives |
| Abuse resistance | Persistent bounded throttling, account-aware controls, trusted-proxy configuration |
| Resource limits | Streaming large exports, concurrent-job limits, storage quotas, full-disk behavior |
| Updates and restores | Durable interruption recovery, fault-injection tests, exact recovery of all application paths |
| Backups | Restrictive filesystem permissions, sensitive-download reauthentication, optional encrypted export |
| Deployment | Read-only runtime application code, least-privilege data access, tested host configurations |
| Observability | Security event coverage and log redaction without storing credentials or session secrets |
| Verification | An applicable OWASP ASVS Level 2 verification target and independent security review |

There is no claim that this checklist has been completed. The current manifest and checksum detect file corruption; they do not authenticate a maliciously replaced release.

## Product and reliability work

- Wider accessibility testing with keyboard users and assistive technologies.
- Realistic larger-site, resource-exhaustion, and concurrent-edit testing.
- Installation, upgrade, and restore matrix across supported hosts.
- More complete conflict recovery and recovery from interrupted publication.
- WYSIWYG editing, richer content schemas, responsive image variants, and optional mail delivery.
- A clear supported-version policy, private vulnerability reporting, and timely security advisories.

## Maintainer policy

Do not describe the beta as fully secure, audited, production certified, or guaranteed to preserve data under every failure. Do not invent uptime, accessibility, SEO, or performance scores. Verify a release's archive, screenshot links, and tests before publishing it.

Keep screenshots and example content separate from live installation data. Never commit DATA_DIR, customer messages, uploaded private documents, owner credentials, installation tokens, or .env files.

See [SECURITY.md](../SECURITY.md), [the upgrade guide](UPGRADING.md), and [the contributing guide](../CONTRIBUTING.md).
