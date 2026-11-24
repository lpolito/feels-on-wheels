"""Check the wheel's definitions against rules.md's "Definitions" check.

Usage, from anywhere: python3 -I docs/opinionated-wheel/scripts/definitions.py

No definition uses its own label or a sibling's label (a word under the same
parent), comparing base forms: Annoyed and annoying are the same word, while
Energetic's "energy" isn't. The parent's label and labels from elsewhere on the
wheel are fine. Needs no datasets, so it becomes a data test with the redesign
(handoff.md, Part 3). Definitions are read from derived-wheel.md, the same way
app-wheel.py reads them. Exits 1 on any failure.
"""
import importlib.util
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

spec = importlib.util.spec_from_file_location("app_wheel", os.path.join(HERE, "app-wheel.py"))
app_wheel = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app_wheel)


def stem(word):
    for suffix in ("ing", "ed", "d", "s"):
        if word.endswith(suffix) and len(word) - len(suffix) >= 3:
            return word[: -len(suffix)]
    return word


def words(text):
    return [stem(w) for w in re.findall(r"[a-z]+", text.lower())]


def uses(definition, label):
    """Whether the definition uses the label, as whole words in base form."""
    d, l = words(definition), words(label)
    return any(d[i : i + len(l)] == l for i in range(len(d) - len(l) + 1))


def main():
    wheel = json.load(open(os.path.join(ROOT, "derived-wheel.json"), encoding="utf-8"))
    defs = app_wheel.definitions()
    fails = []
    # Each group is a parent's path and the labels under it; the cores are siblings too.
    groups = [((), [core["label"] for core in wheel["cores"]])]
    for core in wheel["cores"]:
        c = core["label"]
        groups.append(((c,), [m["label"] for m in core["middle"]]))
        groups += [((c, m["label"]), m["outer"]) for m in core["middle"]]
    for parent, labels in groups:
        for label in labels:
            path = parent + (label,)
            d = defs.get(path)
            if d is None:
                fails.append(f"{' > '.join(path)}: no definition")
                continue
            for other in labels:
                if uses(d, other):
                    what = "its own label" if other == label else f"its sibling's label {other!r}"
                    fails.append(f"{' > '.join(path)}: uses {what}: {d}")
    for f in fails:
        print("FAIL", f)
    print(f"{len(defs)} definitions, {len(fails)} failures")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
