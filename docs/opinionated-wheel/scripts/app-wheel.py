"""Write the derived wheel into the app's data files, for a preview (Lucas, 2026-11-23).

Usage, from anywhere: python3 -I docs/opinionated-wheel/scripts/app-wheel.py

Temporary: the real move into the app comes with the redesign (handoff.md, Part 3).
It rewrites src/data/wheels/core.json and the `feelings` in src/data/feelings.json
and src/data/locales/en.json from derived-wheel.json and the definitions in
derived-wheel.md. Ids follow labels ("At peace" is at-peace). A word on the wheel
twice with one definition keeps one id; moral Disgusted (Angry) is `disgusted` and
physical Disgusted (Bad) is `physically-disgusted`. "You might notice" carries over
from today's feelings.json for words with the same id, and is empty for new ones,
until it's redrafted after the body wheel. The body wheel itself is left out of
src/data/wheels/index.ts while its feelings point at words that are gone.
"""
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
REPO = os.path.normpath(os.path.join(ROOT, "..", ".."))
DATA = os.path.join(REPO, "src", "data")

# Today's color tokens, reused so the preview needs no new colors.
HUES = {"Happy": "happy", "Love": "fearful", "Sad": "sad", "Scared": "surprised", "Angry": "angry", "Bad": "bad"}
KIND = {"Love": ("A feeling of {link}.", "love"), "Angry": ("An {link} feeling.", "angry")}
IDS = {("Bad", "Disgusted"): "physically-disgusted"}


def ident(label):
    return re.sub(r"[^a-z]+", "-", label.lower()).strip("-")


def definitions():
    """Each path's definition (core > middle > outer), from derived-wheel.md."""
    md = open(os.path.join(ROOT, "derived-wheel.md"), encoding="utf-8").read()
    sec = md[md.index("## The wheel, with definitions and data"):md.index("Sorting conflicts recorded")]
    out, stack = {}, []
    for line in sec.splitlines():
        m = re.match(r"(\s*)- \*\*(.+?)\*\*: (?:R3\. )?(.+?\.) \(", line)
        if not m:
            continue
        depth = len(m.group(1)) // 2
        stack = stack[:depth] + [m.group(2)]
        d = m.group(3)
        out[tuple(stack)] = d[0].upper() + d[1:]
    return out


def main():
    wheel = json.load(open(os.path.join(ROOT, "derived-wheel.json"), encoding="utf-8"))
    defs = definitions()
    old_core = json.load(open(os.path.join(DATA, "wheels", "core.json"), encoding="utf-8"))
    old_feelings = json.load(open(os.path.join(DATA, "feelings.json"), encoding="utf-8"))
    locale_path = os.path.join(DATA, "locales", "en.json")
    locale = json.load(open(locale_path, encoding="utf-8"))

    feelings, strings, children = {}, {}, []

    def add(path, label, core):
        fid = IDS.get((core, label), ident(label))
        d = defs[path]
        if fid in strings and strings[fid]["definition"] != d:
            raise SystemExit(f"{label}: two definitions share the id {fid}")
        strings[fid] = {"label": label, "definition": d}
        feelings[fid] = {"sensations": old_feelings.get(fid, {}).get("sensations", [])}
        return fid

    for core in wheel["cores"]:
        c = core["label"]
        cid = add((c,), c, c)
        kind, link = KIND.get(c, ("A {link} feeling.", c.lower()))
        strings[cid].update({"kind": kind, "kindLink": link})
        mids = []
        for mid in core["middle"]:
            m = mid["label"]
            mid_id = add((c, m), m, c)
            outs = [{"feeling": add((c, m, o), o, c)} for o in mid["outer"]]
            mids.append({"feeling": mid_id, "children": outs})
        children.append({"feeling": cid, "hue": HUES[c], "children": mids})

    core_json = {"id": "core", "start": ident(wheel["cores"][0]["label"]), "rings": old_core["rings"], "children": children}
    with open(os.path.join(DATA, "wheels", "core.json"), "w", encoding="utf-8") as f:
        json.dump(core_json, f, indent=2, ensure_ascii=False)
        f.write("\n")
    with open(os.path.join(DATA, "feelings.json"), "w", encoding="utf-8") as f:
        json.dump(feelings, f, indent=2, ensure_ascii=False)
        f.write("\n")
    locale["feelings"] = strings
    with open(locale_path, "w", encoding="utf-8") as f:
        json.dump(locale, f, indent=2, ensure_ascii=False)
        f.write("\n")
    kept = sum(1 for v in feelings.values() if v["sensations"])
    print(f"{len(strings)} feelings ({kept} keep today's 'You might notice'), {len(children)} cores")


if __name__ == "__main__":
    main()
