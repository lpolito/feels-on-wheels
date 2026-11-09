# Feels on Wheels

A free feelings wheel and body sensations wheel, to help you find the word for what you feel. Start from a few core feelings and narrow down, or start from what you notice in your body. Open a word to read what it means.

**Try it: <https://lpolito.github.io/feels-on-wheels/>**

![The feelings wheel with "Curious" opened: its definition, what you might notice in your body, and a close word.](docs/screenshot.png)

## What went into it

It's meant to have everything you'd want from a modern web app, with accessibility and performance treated as features, not afterthoughts.

- **Accessible.** The wheel is drawn on a canvas, but every word is also in a real tree that works with a keyboard and screen readers. It follows your light or dark mode, and respects reduced motion and forced colors (high contrast). Automated accessibility checks (axe) run in the tests.
- **Fast.** Spinning stays smooth: in performance tests, 95% of frames come less than 20 ms apart, in Chromium and Firefox.
- **Small.** No frameworks and no runtime dependencies. Everything a first visit downloads, including every word and definition, is about 34 KB gzipped, against a 60 KB budget that every deploy checks.
- **Offline and installable.** After one visit it works with no connection, and most browsers can install it as an app.
- **Any screen.** Layouts are tested from 280 px phones to 2560 px monitors, in Chromium, Firefox and WebKit, and on Android and iPhone.
- **Private.** No accounts, no tracking, no analytics.

## Built with AI

Feels on Wheels was built with AI, openly and on purpose. It's the first project Lucas made this way.

- **[Claude Code](https://claude.com/claude-code)**, Anthropic's AI coding assistant, wrote the code and helped weigh up how to build each piece.
- **[Superpowers](https://github.com/obra/superpowers)**, Jesse Vincent's skills plugin for Claude Code, shaped how every version was made, and was used heavily:
  - brainstorming each version into a written design;
  - turning that design into a step-by-step plan;
  - building it test first;
  - a fresh code review before anything shipped.
  
  Its visual companion showed mockups in the browser when a choice was easier to see than describe.

The ideas are Lucas's: what the app does, how it looks and how it feels to use. He made every usability and design call, and used each version before the next one was planned. The point was to see how fast, and how complete, an app can get when AI does the building and a person stays in the loop on what makes it good to use.

The whole process is in the repo. Every version's design is in [docs/superpowers/specs](docs/superpowers/specs), and every build plan is in [docs/superpowers/plans](docs/superpowers/plans).

The app itself is plain TypeScript, built with [Vite](https://vite.dev/). It's tested with [Vitest](https://vitest.dev/) and [Playwright](https://playwright.dev/) (with [axe-core](https://github.com/dequelabs/axe-core) for accessibility), and deployed to GitHub Pages by GitHub Actions.

## Running it

Needs Node.js 26.

```sh
npm ci              # install
npm run dev         # run it locally, with hot reload
npm test            # unit tests (Vitest)
npm run test:e2e    # end-to-end tests (Playwright: Chromium, Firefox, WebKit, Pixel 7, iPhone 15)
npm run build       # build to dist/
npm run size        # check the build against the size budget
```

The first `npm run test:e2e` may need `npx playwright install` for the browsers.

Changes reach `main` only through pull requests. Every pull request runs the unit tests, type-check, build, size budget and the end-to-end tests in all five browsers (`.github/workflows/ci.yml`), and all of them must pass to merge. Every push to `main` then deploys to GitHub Pages (`.github/workflows/deploy.yml`).

## Adding a language

A language is one file of words: a copy of `src/data/locales/en.json`, translated. See [CONTRIBUTING.md](CONTRIBUTING.md#languages).

## Ideas and the roadmap

What's built, what's next and what's still an idea are all in [docs/ROADMAP.md](docs/ROADMAP.md). To suggest something, [open an issue](https://github.com/lpolito/feels-on-wheels/issues).

## Credits

Feels on Wheels draws on feelings wheels by Gloria Willcox, Geoffrey Roberts and Lindsay Braman, and on feelingswheel.com. The app's About page credits each one, and [docs/reference/](docs/reference/README.md) has notes on every source.

Made by [Lucas Polito](https://lucaspolito.dev/).

## License

Feels on Wheels is **source-available, not open source**. You're welcome to read, copy, change and translate it for any non-commercial purpose, as long as you give credit. Selling it, running ads on a copy, or making a paid app from it isn't allowed.

The code is under the [PolyForm Noncommercial License 1.0.0](LICENSES/PolyForm-Noncommercial-1.0.0.md). The words (everything in `src/data/`: wheel layouts, definitions, sensations, translations) and the docs are under [CC BY-NC-SA 4.0](LICENSES/CC-BY-NC-SA-4.0.txt). See [LICENSE](LICENSE).
