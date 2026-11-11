# Architecture

## Why this implementation is small

The initial proposal considered Astro and a React admin. This implementation instead uses native Node APIs and a deterministic HTML renderer. There is no package-manager dependency, frontend compilation, or third-party service required to install. The tradeoff is a smaller editing system with deliberately limited rich text and integrations.

## Data ownership

SQLite stores JSON settings/pages, hashed accounts, hashed session identifiers, messages, publication snapshots, and audit events. Uploaded raster files have random immutable filenames. The `data/` directory is the complete operational boundary and is excluded from source control.

Header/footer menu entries reference stable page IDs. Page bodies are structured sections. Theme and font choices are shared settings. Rendering escapes every user-provided string, restricts URLs, and encodes JSON-LD safely. Raw user HTML is never rendered.

## Draft and live boundaries

Saving pages/settings changes draft records. Publishing reads a snapshot, builds into a new temporary directory, renames the completed directory, then commits the revision and current pointer in one SQLite transaction. The in-process lock prevents concurrent publishes inside the supported single-process deployment. Incomplete builds are removed; an orphan completed directory after a database failure is harmless and can be cleaned up after review.

Rollback builds a new publication from an old snapshot. It does not overwrite drafts. Publication assets include only images referenced by public content, although uploaded media remains accessible by its random public URL. Do not use the media library for confidential files.

## Authentication

Passwords use salted scrypt hashes; session IDs are random and stored as SHA-256 digests. Sessions expire after eight hours, use HttpOnly/SameSite=Strict cookies, and can use Secure cookies behind TLS. Admin mutations require both an exact Origin match and session CSRF token. Roles are enforced on the server. Owner credentials are created once through the private setup token. Password changes and console recovery delete all sessions for the account.

The public form endpoint deliberately accepts cross-origin HTML form posts for exported websites. It validates input, rejects filled honeypots, imposes a body limit and peer-IP rate limit, and caps stored messages. Add a managed anti-spam provider or proxy-layer controls if exposed to sustained abuse. No email service is included.

## Extension points

- Add section types in model.mjs, render.mjs, site.css, and the admin section editor.
- Add themes in model.mjs, admin appearance options, and site.css.
- Extend the existing kind/category/tag model with richer relational custom-field schemas.
- Replace or supplement the form inbox with a delivery queue and email adapter.
- Extend original-preserving browser optimization with server-side responsive image variants.
- Add MFA and account recovery only through thoroughly reviewed authentication components.
- Page/settings revision checks reject stale saves; add a merge/recovery interface for larger editorial teams.

Avoid arbitrary JavaScript/template uploads through the admin, which would turn content editing into code execution.

## Updates and schema evolution

Application releases have an allowlisted file boundary and a hash manifest. Offline maintenance runs only after acquiring the same process lock used by the direct server entry point. It stages and validates the archive before creating full data/code recovery copies. No uploaded media, configuration file, or database is copied from a release package. Database migrations check user_version, save a consistent pre-migration database, and apply changes transactionally. Restore stages a full backup before switching data directories and revokes restored sessions. See UPGRADING.md for recovery procedures and the single-server deployment boundary.
