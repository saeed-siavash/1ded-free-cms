# Contributing

The current supported application is in php-edition/. Read its README and docs/TESTING.md. Run PHP syntax checks, RFC 6238 vectors and the integration suite before submitting a pull request. Development tests use Node.js 24+; site owners do not need Node to run PHP.

Use a dedicated disposable database for MariaDB integration. Never run tests against a user's installation. Preserve schema compatibility, private data and the separation between drafts and publication. Include a regression test for security-sensitive behavior. Never commit installed.php, INSTALL-KEY.txt, private directories, accounts, backups, MFA keys, access tokens or generated test fixtures.

Document user-visible changes and update the PHP changelog. Do not run the release packager against an installed source tree. Report vulnerabilities privately as described in SECURITY.md. Opening a contribution does not transfer your copyright; contributions are accepted under this project's MIT license.
