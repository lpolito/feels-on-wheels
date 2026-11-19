# Screenshots of every layout: what shipped differently

Differences from the [spec](2026-11-18-feels-on-wheels-screenshots-design.md), found while building it and reviewing the first builds with Lucas on 2026-11-18.

## The app's scripts stay in the page

The spec's second spike lesson, "remove the script tags before the snapshot", was wrong. Chromatic redraws the saved page with rrweb, which rebuilds the HTML and CSS but never runs the page's scripts, so the app doesn't start again there whether its scripts are in the copy or not. Checked on build 2, which kept them: no app script on the redrawn page and no `window.__fw`. The squeezed wheel and the mouse wording in the spike's first builds came from the first lesson's bug alone (Chromatic showing the default size's capture for every size). The suite no longer removes scripts, and the archive check no longer looks for them.

What follows from Chromatic never running the app: anything the app measures, it measures once, in Chromium on macOS where the test runs, and Chromatic draws those numbers as they are. Text it draws again in its own, wider fonts can sit off from a box measured around the Mac's font. Seen on the wheel switch, where "Body" runs past the dark pill in the snapshot but not in Chromatic's library view, which draws the same copy in the viewer's own browser.

## Names in Chromatic

The spec didn't say how snapshots are named. Chromatic names each from the Playwright test path and shows only its last part on a snapshot's page, which left the device out. The sidebar now groups by screen, and each snapshot's page reads "<device>, portrait or landscape, <size> : <screen>" (Lucas chose grouping by screen). Devices say portrait and landscape rather than upright and sideways.

## A run on main after each labeled PR

The spec planned no run on main, expecting Chromatic to follow a squash merge to the PR's accepted snapshots on its own. It doesn't: it links a squash commit to its PR's last build only when a build runs on that commit. With no build on main, the next labeled PR (#21, build 11) found only the spike's early builds on `6e4d852` and showed all 120 snapshots as new. Merging a PR that has the `screenshots` label now runs the workflow on main too, accepting whatever that build shows as main's baseline (`--auto-accept-changes main`); a merge without the label only looks up its PR's labels. A labeled PR costs at least 240 snapshots, 120 on the PR and 120 on main. Lucas chose this over merge commits, which would keep it at 120, and GitHub's merge queue isn't available to repositories owned by a personal account.

## Smaller calls

- The workflow checks out the PR's own branch, so Chromatic records builds on the PR's commits rather than GitHub's merge commit. Confirmed on build 8.
- Adding a label other than `screenshots` to a labeled PR doesn't start a run.
- The archive check finds two sizes under one test name by grouping the saved files by test, since Chromatic's own files only gain a second size at upload.
