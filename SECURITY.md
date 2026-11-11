# Security

This first public beta has functional security tests but has not received an independent security audit. Use HTTPS, keep Node updated, run as an unprivileged user, protect backups, and follow docs/DEPLOYMENT.md.

Report vulnerabilities privately to the repository owner through GitHub private vulnerability reporting if enabled. Do not include credentials, real customer information, or live exploitation details in public issues. The owner should enable private reporting or add a monitored security email before public release.

Current boundaries: one trusted owner, restricted editors, public image URLs, no MFA, no email recovery, in-memory rate limits, one server process, and no concurrent-edit merge UI (stale saves are rejected). A compromised server account can access the SQLite database; filesystem permissions and backups are part of deployment security.

The included setup token is generated per installation at runtime. Source releases must not include DATA_DIR, `.env`, backup databases, or live sessions.

Offline updates accept only trusted release assets. Manifest hashes detect corruption but do not authenticate the release author. Verify the independently published ZIP checksum. ZIP extraction rejects traversal, symlinks, duplicate paths, unsupported compression, and excessive sizes. Backups contain sensitive account and enquiry data; keep them outside public web roots.
