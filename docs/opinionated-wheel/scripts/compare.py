"""Compare the derived wheel with the app's wheel, and list body-wheel feelings it lacks.

Run from the repo root:
    python3 -I docs/opinionated-wheel/scripts/compare.py

It reads the app's wheels from src/data/wheels/ and the candidate from
docs/opinionated-wheel/derived-wheel.json.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.normpath(os.path.join(HERE, "..", "..", ".."))


def norm(word):
    return word.lower().replace(" ", "-")


def main():
    today = {}

    def walk(node, path):
        p = path + [node["feeling"]]
        today.setdefault(node["feeling"], []).append(p)
        for child in node.get("children", []):
            walk(child, p)

    with open(os.path.join(REPO, "src", "data", "wheels", "core.json"), encoding="utf-8") as f:
        for core in json.load(f)["children"]:
            walk(core, [])

    derived = {}
    with open(os.path.join(HERE, "..", "derived-wheel.json"), encoding="utf-8") as f:
        for core in json.load(f)["cores"]:
            c = norm(core["label"])
            derived[c] = [c]
            for middle in core["middle"]:
                m = norm(middle["label"])
                derived[m] = [c, m]
                for outer in middle["outer"]:
                    derived[norm(outer)] = [c, m, norm(outer)]

    same_place, same_core, other_core, gone = [], [], [], []
    for word, paths in today.items():
        if word not in derived:
            gone.append(word)
            continue
        d = derived[word]
        if any(p == d for p in paths):
            same_place.append(word)
        elif any(p[0] == d[0] for p in paths):
            same_core.append(word)
        else:
            other_core.append(f"{word} ({paths[0][0]} -> {d[0]})")
    new = [w for w in derived if w not in today]

    print(f"today {len(today)} words, derived {len(derived)} words")
    print(f"same place ({len(same_place)}):", ", ".join(sorted(same_place)))
    print(f"same core, other place ({len(same_core)}):", ", ".join(sorted(same_core)))
    print(f"other core ({len(other_core)}):", ", ".join(sorted(other_core)))
    print(f"gone ({len(gone)}):", ", ".join(sorted(gone)))
    print(f"new ({len(new)}):", ", ".join(sorted(new)))

    body = set()

    def leaves(node):
        if not node.get("children") and "feeling" in node:
            body.add(node["feeling"])
        for child in node.get("children", []):
            leaves(child)

    with open(os.path.join(REPO, "src", "data", "wheels", "body.json"), encoding="utf-8") as f:
        leaves(json.load(f))
    missing = sorted(b for b in body if b not in derived)
    print(f"body-wheel feelings not on the derived wheel ({len(missing)} of {len(body)}):", ", ".join(missing))


if __name__ == "__main__":
    main()
