# Changes from the spec

Where *About page rework* as shipped differs from its approved [spec](2026-11-14-feels-on-wheels-about-rework-design.md). The spec stays as it was approved.

- **Made by became the sign-off of Why it exists** (Lucas, 2026-11-14, after building it). There's no Made by section or heading. "Why it exists" ends with "— Lucas Polito" and the GitHub icon, as a closing signature, then the dedication. Credits follow straight after. Section order: What it's for, How to use it, Install it, Why it exists, Credits, Help translate.
- **The heading links home, with the app icon** (Lucas, 2026-11-14, after building it, to give the page some color). The icon and "Feels on Wheels" are one link to `/`, inside the `<h1>`, like a site title on any other site: an ordinary in-app link, not a Back. "Back to the wheel" at the end still returns to the word you were on. The icon is an `<img>` of `/icons/icon.svg` (the favicon file, already downloaded and cached offline), with `alt=""` because the name beside it labels the link. The heading still takes focus when About opens.
