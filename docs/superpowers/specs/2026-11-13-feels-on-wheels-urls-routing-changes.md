# Changes from the spec

Where *URLs: real paths, a small router, and a Worker for first visits* as shipped differs from its approved [spec](2026-11-13-feels-on-wheels-urls-routing-design.md). The spec stays as it was approved.

- **§8:** the service worker takes over as soon as it installs, so devices with the old one don't get a blank page on a word's link.
- **§7:** it serves a real file (robots.txt, the sitemap) at its own address, and the app only for everything else.
- **§1:** a percent-encoded address means the same as the plain one (`/%62ody` is `/body`).
- **§4:** replaced by the [history rule](2026-11-14-feels-on-wheels-history-rule-design.md) ([plan](../plans/2026-11-14-feels-on-wheels-history-rule.md)), back to `main`'s: picking a word or a place adds an entry, and moving by direction replaces it.
