# Feels on Wheels

A free feelings wheel and body sensations wheel, to help you find the word for what you feel. Start from a few core feelings and narrow down, or start from what you notice in your body. Open a word to read what it means.

**Try it: <https://feelsonwheels.app/>**

![The feelings wheel with "Curious" opened: its definition, what you might notice in your body, and a close word.](docs/screenshot.png)

## What went into it

It's meant to have everything you'd want from a modern web app, with accessibility and performance treated as features, not afterthoughts.

- **Accessible.** The wheel is drawn on a canvas, but every word is also in a real tree that works with a keyboard and screen readers. It follows your light or dark mode, and respects reduced motion and forced colors (high contrast). Automated accessibility checks (axe) run in the tests.
- **Fast.** Spinning stays smooth: in performance tests, 95% of frames come less than 20 ms apart, in Chromium and Firefox.
- **Small.** No frameworks and no runtime dependencies. Everything a first visit downloads, including every word and definition, is about 34 KB gzipped, against a 60 KB budget that every pull request checks.
- **Offline and installable.** After one visit it works with no connection. To keep it handy, install it from your browser's menu, or use Add to Home Screen on an iPhone or iPad.
- **Any screen.** Layouts are tested from 280 px phones to 2560 px monitors, in Chromium, Firefox and WebKit, and on Android and iPhone.
- **Private.** No accounts, no tracking, no analytics. Nothing you choose leaves your device.

## Research behind the body wheel

The body sensations wheel starts from what you notice in your body and leads to the feelings that often come with it. It isn't made up on a whim: every sensation and urge on it rests on something you can check, and the few that rest on common speech or one person's experience say so. It's for finding words, not a clinical or diagnostic tool.

### How it's built

- **Places you could point to, plus Urges.** The areas run head to toe in a body scan's order (Head / face, Throat / mouth, Shoulders, Hands, Chest, Stomach), then Whole body for what you feel all over. The last area, Urges, holds what you feel pulled to do: run, hide, lash out, numb out. Many people notice the pull before they can name the feeling.
- **A sensation is something you'd notice with your eyes closed and nobody watching.** What others see, like a smile or raised eyebrows, isn't on the wheel.
- **One sensation, several feelings.** The same body signal can mean different things: a racing heart can be scared or excited, and feeling flat can be numb or content. The wheel offers both readings where they're real, and offers happy feelings only as the other reading of a sensation, since few people need help knowing they're happy.

### What the research found

- **Where people feel emotions.** Over 700 people painted where they felt each emotion grow or fade. Most basic emotions showed up in the upper chest; anger in the arms and hands; disgust in the throat and gut; sadness drained the limbs; happiness filled the whole body. The maps matched across cultures. ([Nummenmaa and others](docs/reference/nummenmaa-bodily-maps.md))
- **Sensing your body from inside** is called interoception, and it's what the eyes-closed test describes. ([Craig](docs/reference/craig-interoception.md))
- **What fear, anxiety, and low mood feel like** is spelled out in the standard clinical lists: a pounding heart, a tight throat, lightheadedness, feeling empty, fatigue. ([DSM-5](docs/reference/dsm-5-symptoms.md))
- **Urges are part of an emotion,** separate from its sensations: fear pulls you to escape, anger to fight, disgust to reject, guilt to make it right. ([Frijda](docs/reference/frijda-action-tendencies.md), [DBT](docs/reference/linehan-dbt-model-of-emotions.md))
- **Many urges are a way to stop feeling something,** like numbing out, and noticing the pull without acting on it is a skill taught in recovery. ([Hayes and others](docs/reference/hayes-experiential-avoidance.md), [Marlatt](docs/reference/marlatt-urge-surfing.md))
- **Particular paths:**
  - disgust is felt as nausea and gagging ([Rozin](docs/reference/rozin-disgust.md));
  - giving up follows what you can't control ([Maier and Seligman](docs/reference/maier-seligman-learned-helplessness.md));
  - people cry from frustration and being moved, not just sadness ([Vingerhoets](docs/reference/vingerhoets-crying.md));
  - rejection registers like pain ([Eisenberger and others](docs/reference/eisenberger-social-pain.md));
  - the urge to help comes with caring ([Goetz and others](docs/reference/goetz-compassion.md));
  - insecurity can pull you toward closeness ([Mikulincer and Shaver](docs/reference/mikulincer-shaver-attachment.md));
  - anger often covers hurt ([Greenberg](docs/reference/greenberg-emotion-focused-therapy.md)).
- **Calm and numb can feel alike.** Low-energy feelings can be pleasant or unpleasant ([Russell](docs/reference/russell-circumplex.md)), and calm acceptance is easily confused with numbness; whether you still care is the difference ([Desbordes and others](docs/reference/desbordes-equanimity.md)).
- **Body idioms** like butterflies or a lump in your throat often grow out of what the body really does, which is why idioms that name a real sensation are allowed. ([Kövecses](docs/reference/kovecses-emotion-metaphors.md))

### What isn't research

- **Common speech:** some words rest mainly on common speech for something people feel, such as Butterflies, Buzzing, Sinking feeling, Heavy heart, and Skin crawling.
- **Lucas's own experience:** a few also rest on Lucas's experience: Heart in throat, Weight on shoulders, Numb / empty, and Flat.

What backs each word is in the [design spec](docs/superpowers/specs/2026-11-15-feels-on-wheels-body-wheel-rework-design.md#3-the-wheel) and its [changes](docs/superpowers/specs/2026-11-15-feels-on-wheels-body-wheel-rework-changes.md).

### How it was decided

- **Lucas set the frame and the rules:** places plus Urges, the eyes-closed test, and every common path on the wheel.
- **Claude did the research and drafting:** it found and summarized the research, and drafted the words and what backs each one.
- **Lucas made every call:** he reviewed every word over several rounds, rewrote and cut freely, and decided each one. AI suggestions that didn't hold up were dropped.
- **A second, separate AI review** checked each claim against its source. The [notes](docs/reference/README.md) say which sources were read in full and which only through abstracts or summaries.
- **Lucas isn't a clinician or a researcher,** and doesn't claim to be.
- **The rules** that keep the wheel this way are in [src/data/wheels/README.md](src/data/wheels/README.md).

**If a word seems wrong or missing,** or you know research that says otherwise, please [open an issue](https://github.com/lpolito/feels-on-wheels/issues). Corrections from therapists and researchers are especially welcome.

## Made with AI, with love

Feels on Wheels was built with AI, openly and on purpose. It's the first project Lucas has taken from idea to finished app with AI.

- **[Claude Code](https://claude.com/claude-code)**, Anthropic's AI coding assistant, wrote the code and helped weigh up how to build each piece.
- **[Superpowers](https://github.com/obra/superpowers)**, Jesse Vincent's skills plugin for Claude Code, shaped how every change was made, and was used heavily:
  - brainstorming each change into a written design;
  - turning that design into a step-by-step plan;
  - building it test first;
  - a fresh code review before anything shipped.
  
  Its visual companion showed mockups in the browser when a choice was easier to see than describe.

The ideas are Lucas's: what the app does, how it looks and how it feels to use. He made every usability and design call, and used each change before the next one was planned. The point was to see how fast, and how complete, an app can get when AI does the building and a person stays in the loop on what makes it good to use.

The whole process is in the repo. Every change's design is in [docs/superpowers/specs](docs/superpowers/specs), and every build plan is in [docs/superpowers/plans](docs/superpowers/plans).

The app itself is plain TypeScript, built with [Vite](https://vite.dev/). It's tested with [Vitest](https://vitest.dev/) and [Playwright](https://playwright.dev/) (with [axe-core](https://github.com/dequelabs/axe-core) for accessibility), and hosted on [Cloudflare Workers](https://developers.cloudflare.com/workers/static-assets/) as static files plus a small Worker for paths with no file (`wrangler.jsonc`, `src/worker/`).

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

Changes reach `main` only through pull requests. Every pull request runs the unit tests, type-check, build, size budget and the end-to-end tests in all five browsers (`.github/workflows/ci.yml`), and all of them must pass to merge. Cloudflare's GitHub integration then deploys every push to `main`, except pushes that only change docs, and posts a preview link on each pull request.

## Adding a language

A language is one file of words: a copy of `src/data/locales/en.json`, translated. See [CONTRIBUTING.md](CONTRIBUTING.md#languages).

## Ideas and the roadmap

What's built, what's next and what's still an idea are all in [docs/ROADMAP.md](docs/ROADMAP.md). To suggest something, [open an issue](https://github.com/lpolito/feels-on-wheels/issues).

## Credits

Feels on Wheels draws on feelings wheels by Gloria Willcox, Geoffrey Roberts and Lindsay Braman, on feelingswheel.com, and, for the body wheel, on the [research above](#research-behind-the-body-wheel). The app's About page credits each one, and [docs/reference/](docs/reference/README.md) has notes on every source.

Made by [Lucas Polito](https://lucaspolito.dev/).

## License

Feels on Wheels is **source-available, not open source**. You're welcome to read, copy, change and translate it for any non-commercial purpose, as long as you give credit. Selling it, running ads on a copy, or making a paid app from it isn't allowed.

The code is under the [PolyForm Noncommercial License 1.0.0](LICENSES/PolyForm-Noncommercial-1.0.0.md). The words (everything in `src/data/`: wheel layouts, definitions, sensations, translations) and the docs are under [CC BY-NC-SA 4.0](LICENSES/CC-BY-NC-SA-4.0.txt). See [LICENSE](LICENSE).
