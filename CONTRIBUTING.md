# Contributing to Feels on Wheels

Thanks for wanting to help. Ideas and new languages are especially welcome. Everyone taking part agrees to the [code of conduct](CODE_OF_CONDUCT.md). To report a security issue, see [SECURITY.md](SECURITY.md) rather than opening a public issue.

## Ideas

[Open an Idea issue](https://github.com/lpolito/feels-on-wheels/issues/new?template=idea.yml) describing what you'd like and why. Lucas decides what goes on the [roadmap](docs/ROADMAP.md); ideas he picks are designed there before anything is built.

## Languages

Every word the app shows lives in one file per language. English is `src/data/locales/en.json`.

1. **Open a [New language issue](https://github.com/lpolito/feels-on-wheels/issues/new?template=language.yml) first** naming the language, so two people don't translate the same one.
2. Copy `en.json` to the language's code (for example `es.json`) and translate every string:
   - `ui`: buttons, labels and messages;
   - `feelings`: every feeling's label and definition;
   - `sensations` and `areas`: the body sensations wheel;
   - `wheels`: each wheel's name and start message;
   - `page`: the page title, description and the About page.
3. Keep `{placeholders}` such as `{label}` exactly as they are, and keep `[link text](target)` links' targets.
4. Write plain, everyday language. A definition should read naturally in your language rather than follow the English word for word.
5. Follow the [content rules](docs/ROADMAP.md#content-rules): don't copy another feelings wheel or word list, and credit any source you draw on.

The app doesn't have a language switcher yet: it's [planned](docs/ROADMAP.md#languages). A finished translation is still worth sending; it'll ship with the switcher.

## Code

- Run `npm test` and `npm run test:e2e` before opening a pull request. See the [README](README.md#running-it). The same checks run on every pull request, and they must pass before it can merge.
- Follow the existing style. Every change comes with a test.
- Larger changes start with an issue, so we can agree on the approach first.

## Contribution terms

By contributing, you agree that your contribution is licensed under this repository's licenses (PolyForm Noncommercial 1.0.0 for code, CC BY-NC-SA 4.0 for content), and you grant Lucas Polito a perpetual, worldwide, irrevocable, royalty-free license to use, change and relicense your contribution under any terms, including commercial ones. You keep the copyright on your work, and you confirm you have the right to contribute it.

The pull request template asks you to tick a box agreeing to these terms.
