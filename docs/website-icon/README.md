# Feels on Wheels icon for lucaspolito.dev

**Do this only once Feels on Wheels has its own domain. Never link the github.io address.** Lucas wants his site to link the app's permanent home; see "Moving to a domain" in the [README](../../README.md#moving-to-a-domain) and step 2 of [Before going public](../ROADMAP.md#step-2-before-launching-it).

A link icon for the row of icons on Lucas's site, in that site's style: grey at rest like the GitHub, LinkedIn and email icons. On hover, keyboard focus or a tap it takes the wheel's seven core-feeling colours and spins once, like a prize wheel, then settles. Chosen on 2026-11-09 ([going-public spec §9](../superpowers/specs/2026-11-09-feels-on-wheels-going-public-design.md)).

## What's here

| File | What it is |
|---|---|
| `feels-on-wheels.svg` | The silhouette, used as a CSS mask like the site's other icons: the app icon's wheel with its hole, core ring and seven spokes. |
| `feels-on-wheels.css` | The rules to add to the site's stylesheet. |
| `snippet.html` | The link to add to the site's `#links` row. |
| `preview.html` | The site's links row with the new icon, using the live site's stylesheet. |

To see the preview, serve this folder (`python3 -m http.server 8000`) and open <http://localhost:8000/preview.html>. CSS masks don't load from `file://`.

## Adding it to the site

The site's repo is `~/dev/lucaspolito.dev` (`lpolito/lucaspolito.dev`). It's one static page with no build step. GitHub Pages serves `main` behind Cloudflare, so pushing `main` deploys it.

1. **Copy the icon.** Copy `feels-on-wheels.svg` to `~/dev/lucaspolito.dev/icons/feels-on-wheels.svg`.
2. **Add the CSS.** Paste the contents of `feels-on-wheels.css`, header comment included, into `~/dev/lucaspolito.dev/css/styles.css` straight after the `.icon-linkedin { … }` rule. It relies on the site's own `.icon`, `.icon::after`, `a` and `--gradientStops` rules being there. Its `--icon` path (`../icons/…`) is relative to `css/`, like the other icons.
3. **Add the link.** In `~/dev/lucaspolito.dev/index.html`, add the contents of `snippet.html` as the **last** `<a>` inside `<nav id="links">`, unless Lucas asks for another position. Replace `DOMAIN` with the app's domain. Don't add `rel="me"`: that's for profiles that are Lucas himself.
4. **Check it** with `python3 -m http.server 8000` in `~/dev/lucaspolito.dev`, at <http://localhost:8000>:
   - **At rest** the wheel is the same grey as the other icons.
   - **Hover:** it takes the seven colours and spins once in about a second, then settles. Moving away and back spins it again.
   - **Keyboard:** Tab to it. It shows the colours, spins, and gets the site's focus outline.
   - **Reduced motion** (in the browser's dev tools, emulate `prefers-reduced-motion: reduce`): the colours appear but it doesn't spin.
   - **Forced colours** (emulate `forced-colors: active`): it shows as a plain silhouette, like the other icons.
   - **Phones:** four icons fit at 320 px wide. With the site's sizes that's 4 × 3.5rem plus 3 × 1.5rem gaps, 296 px; the preview measured 290 px.
   - **Contrast:** every colour clears the site's 3:1 rule on `#121214` (the ratios are in the CSS's header comment), so it follows the site README's "Adding a gradient" rule too.
5. **Update the site's README.** Under "What's where", the `icons/` line becomes: "link icons (GitHub, LinkedIn, email, Feels on Wheels), used as CSS masks so they can fill with colour on hover".
6. **Commit and push** `main` in that repo, with a message like "Add Feels on Wheels link". Cloudflare caches CSS for up to 4 hours, so the icon can take that long to look right for returning visitors.
7. **Here:** remove "Add the icon to lucaspolito.dev" from step 2 of [Before going public](../ROADMAP.md#step-2-before-launching-it) in this repo's roadmap.
