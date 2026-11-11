# Deployment

## Supported hosting

Run one Node.js 24+ process with persistent local storage. A VPS, dedicated server, or container host is suitable. SQLite WAL storage should be on a local disk, not a shared network filesystem. Multiple replicas are not supported. The site renderer and admin have no npm dependencies.

Use a root domain, not a URL subdirectory. The public website and `/admin/` may share the same origin. The UI is English; generated site language and direction are configurable.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | Bind address. Docker sets `0.0.0.0`. |
| `PORT` | `3000` | HTTP listening port. |
| `DATA_DIR` | `./data` beside server.mjs | Persistent database, media, releases. |
| `PUBLIC_ORIGIN` | Derived from HTTP Host | Exact browser origin for admin write requests, e.g. `https://example.com`. Always set in production. No trailing slash. |
| `COOKIE_SECURE` | `false` | Set `true` behind HTTPS. |
| `SETUP_TOKEN` | Random at startup | Optional private installation token. Remove after installing. |

For direct Node, `node --env-file=.env server.mjs` loads the environment file. `node server.mjs` alone reads exported process variables, not `.env`. Docker Compose reads `.env` automatically for its substitutions.

The public site URL in Site settings is a separate value used for canonical URLs and sitemaps. Set it to the public website domain, which may differ from the admin origin when exporting to another host.

## HTTPS reverse proxy example: Caddy

```caddyfile
example.com {
    reverse_proxy 127.0.0.1:3000
    header Strict-Transport-Security "max-age=31536000"
}
```

Start the CMS with `PUBLIC_ORIGIN=https://example.com`, `COOKIE_SECURE=true`, and `HOST=127.0.0.1`. Configure DNS and Caddy TLS normally. Do not expose the raw HTTP port publicly.

Rate limits intentionally use the direct peer IP and ignore spoofable forwarded headers. With a reverse proxy, clients share the application limit. Configure per-client login/form throttling at the trusted reverse proxy and adjust operationally if your traffic needs more capacity. No automatic trust of `X-Forwarded-For` is implemented.

## systemd example

Install the project at `/opt/1ded-free-cms`, create a dedicated unprivileged `1ded` service user, and grant it write access only to `/var/lib/1ded`. Keep application code readable but not writable by that service user.

```ini
[Unit]
Description=1DED Free CMS
After=network.target

[Service]
Type=simple
User=1ded
WorkingDirectory=/opt/1ded-free-cms
ExecStart=/usr/bin/node /opt/1ded-free-cms/server.mjs
Environment=NODE_ENV=production
Environment=HOST=127.0.0.1
Environment=PORT=3000
Environment=DATA_DIR=/var/lib/1ded
Environment=PUBLIC_ORIGIN=https://example.com
Environment=COOKIE_SECURE=true
Restart=on-failure
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/1ded

[Install]
WantedBy=multi-user.target
```

Check the actual path to your Node executable. Access the first-install token through the service journal. Restrict journal access; the token is a temporary installation secret.

## Publication and exports

Every successful publish creates `data/releases/<uuid>/`. The database pointer is changed only after all files are generated. If an image is missing or a homepage is not publishable, generation fails and the current pointer is preserved. Published pages are read from that snapshot; draft settings do not alter them.

The built-in server serves 301 redirects from the published snapshot. Exports include `_redirects` and `nginx-redirects.conf`. Configure your host's 404 handler to use `404.html` with HTTP status 404.

Generated assets use absolute root paths. Export deployments must use a root domain. To keep forms on the CMS after exporting, set Form endpoint to `https://cms.example.com/api/contact` before publishing; that endpoint accepts standard form POSTs, but the CMS inbox still needs to stay online. The built-in form does not send email notifications.

## Backup and restore

The full console backup uses SQLite's online backup API and copies immutable media/releases. Avoid publishing or uploading during a console backup for a clean operational snapshot. For a guaranteed quiet backup, stop the service and copy all of DATA_DIR. Never copy only a live `cms.sqlite` file while omitting its WAL file.

Docker deployments can back up the volume using normal volume backup tools with the service stopped. Do not run `docker compose down -v` unless you intend to delete the installation.

To restore, stop the service, restore the complete directory to a separate location, set correct ownership, set DATA_DIR, and restart. Verify login, images, inbox, previews, and the current public website before switching traffic.

## Before a public launch

- Use HTTPS, secure cookies, a fixed PUBLIC_ORIGIN, and firewall restrictions on the raw port.
- Finish setup before making the URL widely discoverable.
- Use a long unique owner passphrase and least-privilege editor accounts.
- Verify your website domain, metadata, contact details, and form submission workflow.
- Publish and check desktop/mobile layout, navigation, 404 behavior, and sitemap.
- Configure a privacy notice suitable for your actual contact-data handling.
- Back up and test a restore. Monitor disk space and server errors.
- Run `node --test` after changes and review security-sensitive changes before deploying.

Docker configuration is supplied, but must be validated on your target Docker host. No container build was performed as part of the initial Windows implementation.

## Safe application upgrades

Use the dedicated [upgrade guide](UPGRADING.md). For direct Node installations, stop the service and run the offline updater with the same DATA_DIR. It creates a full code/data backup and never copies uploads or .env from a release. Schema changes create database safety backups and run transactionally. For Docker, rebuild the application image while retaining the same named data volume. Browser full-backup ZIPs and the restore command include images, unlike the legacy database-only download.
