# About page rework: design

Approved by Lucas on 2026-11-14. Roadmap entry: [About page rework](../../ROADMAP.md#about-page-rework).

## Intent

Make the About page friendlier by keeping only what a visitor cares about, and add why the app exists, in Lucas's own voice. People who come to a feelings wheel are often where Lucas was. A short, real story makes the page feel made by a person.

## Goals

- Keep what it's for, how to use it, the install steps, Made by, the credits, and Help translate.
- Add "Why it exists", in Lucas's words, ending with the dedication.
- Link the GitHub repo with a small GitHub icon in Made by.
- Fix the credit links: link each work's title, not its author, and point Roberts's link at the archive.org copy.
- Say no more than has been tested about screen readers.
- Put a left chevron on "Back to the wheel".

## Non-goals

- **A floating back button.** Dropped for now (2026-11-14).
- **Moving the About link into the start message**, and [help adding it to the home screen](../../ROADMAP.md#help-adding-it-to-the-home-screen). Both are separate ideas. The new Install it section gives the second one somewhere to link to later.
- **Anything about AI on the page.** That's in the README.

## The page

In this order. The text is final unless marked otherwise. The new text uses Oxford commas (Lucas's preference).

**Feels on Wheels** (h1) and the summary: unchanged.

**What it's for:** unchanged.

**How to use it:** the first paragraph is unchanged. The second becomes:

> Switch between the two wheels at the top. Everything works with a keyboard, and it's built for screen readers. [Read about its accessibility]({accessibility}).

`{accessibility}` is a new link key pointing to `ACCESSIBILITY.md` in the repo, which says no screen reader has been tried by hand yet.

**Install it** (new, id `install`):

> To keep it handy, install it from your browser's menu, or use Add to Home Screen on an iPhone or iPad.

**Why it exists** (new, id `why`). Lucas's text, approved word for word:

> I always had trouble identifying my emotions. For much of my life they only came out as anger, or I couldn't feel very much at all. Through therapy, journaling, and checking in with myself daily, I came to lean on a feelings wheel to sort out the words for my deeper feelings.
>
> I wanted to make a version that's accessible, beautiful, fast, and versatile, for anyone else who needs help finding the words for how they feel. I hope it helps.
>
> For A, E, and M.

The dedication is its own paragraph and closes the section.

**Made by:**

> [Lucas Polito]({author}) [Feels on Wheels on GitHub]({github})

The `{github}` link is drawn as the GitHub icon, right after the name.

**Credits:** moved under Made by. The intro paragraph is unchanged. In each item the work's title is the link and the author's name is plain text:

- Gloria Willcox, "[The Feeling Wheel](https://doi.org/10.1177/036215378201200411)", …
- Geoffrey Roberts, "[The Feel Wheel](https://web.archive.org/web/20180505024944/https://imgur.com/tCWChf6)", … (archive.org copy, since the imgur image is gone)
- Lindsay Braman, "[Emotion-Sensation Wheel](https://lindsaybraman.com/emotion-sensation-feeling-wheel/)", …
- [feelingswheel.com](https://feelingswheel.com/): unchanged, since it has no separate title.

The rest of each item's text is unchanged.

**Help translate:** unchanged.

**Removed:** "Private and offline" (its install sentence moves to Install it) and "Source and license". Both stay covered in the README.

**‹ Back to the wheel:** a small left chevron before the text, hidden from screen readers. The link's name and behavior are unchanged.

## How it's built

- Almost all of the change is text in `page.about` in `src/data/locales/en.json`.
- **The GitHub icon is a link key that draws an icon.** In the builder's link rule (`linkify` in `build/site.ts`), a link to `{github}` (the repo's URL) is drawn as an inline GitHub mark SVG. The SVG is hidden from screen readers, and the link's label ("Feels on Wheels on GitHub") becomes its accessible name and its hover tooltip. The label is ordinary link text, so translators translate it like any other.
- **The chevron** is an inline SVG inside the back link, hidden from screen readers. It's drawn in the text color, the same way as the GitHub icon.
- No new runtime code. The page is rendered at build time, as it is today.

### Approaches considered

1. **A link key that draws an icon** (chosen). The text stays an ordinary link, with no new syntax or field. It's about five lines in the link rule.
2. **An icon field on the section** (icon name, spoken name, link), drawn after the section's text. That's more structure for the same result. Lucas pointed out it was overbuilt.
3. **Writing the icon straight into the builder for Made by.** Ruled out: its spoken name would live in the code, and ACCESSIBILITY.md says all text belongs in the locale file.

## Left to the builder

- The SVG paths: GitHub's mark, and a simple chevron sized to the text.
- Icon size, spacing, and focus outline, in the page's existing style.
- Check that the archive.org copy of Roberts's post shows the picture. If it doesn't, stop and ask before linking it.
- Update the tests that check the page's sections, links, and accessibility.
- In the same change: update `ACCESSIBILITY.md`'s known limitations if anything there changes; remove the Roberts known issue and the About rework idea from the roadmap, add the Shipped row, and update `docs/reference/core-feelings-wheel.md` with the link change.
