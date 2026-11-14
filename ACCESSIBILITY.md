# Accessibility

Feels on Wheels exists to help people find the word for what they feel. That should work for everyone: whether you use touch, a mouse or a keyboard, a screen reader, larger text, high contrast or less motion, on a phone or a computer. If something gets in your way, that's a problem with the app, not with you, and it's worth reporting.

This file says what the app aims for, what has been checked and how, what's known not to work yet, and how to report a barrier.

## Priorities

The goal is [WCAG 2.2](https://www.w3.org/TR/WCAG22/) level AA. That's a goal, not a claim: the app hasn't had a formal accessibility evaluation.

What the app is built to do:

- **Every action works by touch, mouse, trackpad and keyboard.** On the wheel, the arrow keys move between words and in and out of the rings, Enter or Space opens a word, and Escape steps back.
- **Screen readers get the wheel as a tree.** The drawn wheel is hidden from screen readers. In its place is a tree of the same words that you move through with the arrow keys, and each choice is announced.
- **Your settings are followed:** light or dark mode (the system's, or the one you choose in the app), reduced motion, more contrast, and forced colors such as Windows high contrast.
- **Easy to read and tap:** text is checked for contrast in both themes, and on a phone the wheel zooms into the ring you're in so each word's cell is at least 44 px tall.
- **Plain language:** definitions and sensations are short, everyday words.

## Contributor expectations

Every change that affects what people see or do should keep the app as usable as it was. Before opening a pull request:

- Run `npm test` and `npm run test:e2e`. The end-to-end tests run [axe](https://github.com/dequelabs/axe-core) on both wheels and the About page, in light and dark mode, and check that the wheel and card work from the keyboard. They run in Chromium, Firefox and WebKit, at desktop and phone sizes, on every pull request, and must pass before it can merge.
- Try your change with the keyboard alone: everything reachable with Tab and the arrow keys, focus always visible, nothing focused hidden under something else.
- Give every new control a name a screen reader can say, and put all new text in the locale file (`src/data/locales/en.json`), never in the code.
- Check new colors for contrast in both themes, and keep new animation off when reduced motion is on.
- In the pull request, say how you checked it: the keyboard, a screen reader if you have one, a phone.

## Reporting accessibility issues

[Open an Accessibility issue](https://github.com/lpolito/feels-on-wheels/issues/new?template=accessibility.yml). It asks:

- what you were trying to do, and what got in the way;
- the address in your browser when it happened (it includes the word you had open);
- your device, system and browser;
- any assistive technology or settings you use, such as a screen reader, zoom, larger text or high contrast.

A screenshot or recording helps but isn't needed. You never need to say anything about a disability.


### Severity

There are no severity levels. A barrier that stops someone from finding or reading a word comes before anything else.

### How we respond

Lucas will reply as soon as he can, and accessibility barriers come before other work. If there's a way around the problem in the meantime, the reply says so. Once there's a fix, you're welcome to check it on the live site, which updates when the fix merges.

## Ownership and maintenance

Lucas maintains Feels on Wheels on his own and owns its accessibility. This file is reviewed when each change ships, along with the [roadmap](docs/ROADMAP.md), so its known limitations stay current.

## Supported environments

- **Browsers:** current versions of Safari, Chrome, Edge and Firefox, on phones, tablets and computers, in the browser or installed as an app.
- **Input:** touch, mouse, trackpad and keyboard.
- **Checked automatically, on every pull request:** axe and the keyboard tests, in Chromium, Firefox and WebKit, at desktop size and at the sizes of a Pixel 7 and an iPhone 15. These run in a test browser that only imitates a phone's screen size, not on real phones.
- **Not yet tested by hand:** any screen reader (VoiceOver, TalkBack, NVDA, JAWS, Narrator), voice control, switch access, screen magnifiers, and browser zoom. The app is built for them, but nobody has walked through it with them yet. If you use one, a report of how it went, good or bad, is very welcome.

## Known limitations

These are known and tracked in the [roadmap's known issues](docs/ROADMAP.md#known-issues).

- **Choosing a word with the keyboard or a screen reader on a phone-size screen** can choose one on the half of the wheel that's off screen, without turning the wheel to show it. The card still opens with the word.
- **On a phone, swiping back from the edge of the screen doesn't work on the wheel**, because the wheel takes every touch. Use the browser's Back button instead. In the app installed to an iPhone's home screen there's no Back at all: use Start over, or "Back to the wheel" on the About page.
- **On the wheel, pinching zooms the wheel itself, not the page.** To make text larger, use the browser's or the system's text size or zoom settings.
- **Small windows**, which can include a computer's browser zoomed in a long way, may show the body sensations wheel without labels until you open something. The card's words are still there.
- **On some phones, turning the phone sideways and back** can leave the card's text much larger than it should be, and after several turns, taps can land on the wrong word. Closing the word, or reloading the page, may set it right.
- **Double-tapping the label that shows the theme choice** zooms the page on phones, and pinching out doesn't undo it. Double-tap the label again while it's still showing to zoom back out.
- **Long body sensation words**, such as "Hollow feeling in your chest", can run past the edges of their cell when opened. The card shows them in full.
- **On very short phones**, the opened word can sit under the toolbar.
- **Linux computers with a wide default font** may show the wheel switch overlapping the toolbar on very narrow windows.

## Feedback and improvements

To suggest a change to this file or to how the app handles accessibility, [open an Idea issue](https://github.com/lpolito/feels-on-wheels/issues/new?template=idea.yml) or a pull request. If something is in your way right now, use the [Accessibility issue](#reporting-accessibility-issues) instead.
