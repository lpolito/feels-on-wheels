# Security

Feels on Wheels is a web app served as static files, plus a small Cloudflare Worker that answers the first visit to an address with no file of its own (its title and preview tags, a redirect, or not found). It has no accounts, no database, and no tracking, and nothing you choose leaves your device. Security issues are still possible, for example in the build, the Worker, the service worker, or the GitHub Actions workflows.

## Reporting a vulnerability

Please report it privately, not in a public issue: use [Report a vulnerability](https://github.com/lpolito/feels-on-wheels/security/advisories/new) on this repository's Security tab. Lucas will reply as soon as he can, and credit you in the fix if you'd like.

## Supported versions

Only the live site, <https://feelsonwheels.app/>, and the `main` branch are supported. Fixes ship by merging to `main`, which redeploys the site.
