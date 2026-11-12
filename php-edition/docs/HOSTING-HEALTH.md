# Hosting health

Open **Updates & backups → Hosting health** as the owner. Choose **Run checks again** after a PHP setting change or manual code update. Editors and signed-out visitors cannot retrieve the report. Checks run locally; no external service is contacted.

## What the results mean

- **Passed**: the particular local check succeeded. This is not a security certification.
- **Review**: follow the explanation before relying on the installation. Some reviews are expected, such as HTTP on a local preview or the absence of signed updates in this release.
- **Action needed**: ask your hosting provider to correct missing PHP requirements, a public storage location or unwritable directories.

The panel reports PHP version and necessary extensions, writable private directories, HTTPS as seen by PHP, storage placement relative to this site's reported web root, owner MFA coverage, publication availability and local full backups. A backup less than seven days old passes the freshness check. Local backup presence does not prove that the archive is valid or that an off-host copy exists. Always download an off-host copy and test restoration separately.

## Application integrity after updates

Release packages include a SHA-256 file manifest. The panel compares listed application files with that local manifest and lists changed/missing relative paths. Custom edits also appear as changes. A missing or malformed manifest produces a review result. Runtime configuration and private data are excluded from the manifest.

A local manifest cannot authenticate its own publisher: an attacker who replaces both the code and manifest can defeat this comparison. Extra unlisted files are not checked. Obtain packages from the trusted project source, verify the separately published ZIP checksum, and keep an independent copy. Signed updates remain future work.

## Important limits

The report cannot discover every addon-domain web root, confirm that Apache deny rules work, prove cron ran, inspect a provider's patch backports, validate mail delivery, or replace an independent security assessment. Check addon-domain roots in File Manager. Configure HTTPS and cron in cPanel/DirectAdmin, then verify the public site and scheduled publication yourself.

No database passwords, MFA secrets, session tokens or absolute private-storage paths are returned. The report is owner-only because versions and file differences are operational details.
