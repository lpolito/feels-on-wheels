"""Checks and flags for the feelings wheel's words that need the word datasets, by src/data/README.md.

Usage, from the repo root: WHEEL_DATA=/path/to/datasets python3 -I scripts/wheel-words/check.py
See README.md here for the datasets. The checks that need only the wheel files run in CI
(tests/unit/data.test.ts); once and layout run here too, beside the word table.
Reads the app's wheel (src/data/wheels/core.json, labels from src/data/locales/en.json), ngram-cache.json (fetching any phrase it
lacks through ngrams.py), and the datasets through lex.py's loaders. Prints a
per-word table, then what's noted, flagged, and failed.

Failures (exit status 1), from "What the script checks":
  pleasantness  a word every list that scores it puts on the other side from its core
                (cleared by a reason in PLEASANTNESS_REASONS)
  once          a label twice, comparing base forms (Love and Loved), except SPLITS
  layout        a middle word with fewer than 2 or more than 3 outer words

Flags, from "What the script flags, never decides" (each is answered by a line
of reason in the change that keeps the word, or by changing the word):
  pleasantness  unscored in both lists (with a base form's score as a hint), the
                lists disagree, or near neutral (Warriner 4 to 6, NRC -0.2 to 0.2)
  rare          both counts under 15 per billion ("feel / feeling / felt ___" and
                "I was ___"; nouns have only the first)
  synonym       a candidate used at least twice as often in every count both have.
                Candidates: ALTERNATIVES, plus the word's strongest Small World of
                Words associations that are feeling words not on the wheel, where
                the link runs both ways and NRC puts both on the same side
  core label    fewer than 4 middle words; under 75% of 4- to 6-year-olds knew it
Counts are the median of 2018-2022 (ngrams.py), less the phrases in NOT_FEELINGS.
The ratio between the two counts is printed, never flagged.
"""
import importlib.util
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.normpath(os.path.join(HERE, "..", ".."))

spec = importlib.util.spec_from_file_location("lex", os.path.join(HERE, "lex.py"))
lex = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lex)

spec = importlib.util.spec_from_file_location("ngrams", os.path.join(HERE, "ngrams.py"))
ngrams = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ngrams)

PLEASANT = {"Happy", "Love"}
RARE = 15.0            # per billion: rare only when every count is under this (src/data/README.md, "Usage")
SYNONYM_RATIO = 2.0    # Lucas, 2026-11-20: commonness decides a swap at twice as often
SWOW_TOP = 10          # how many of a word's strongest associations to consider

# Labels whose counts or valence come from a shorter form.
COUNT_AS = {"Sorry for someone": "sorry for"}
LOOKUP_AS = {"Sorry for someone": "sorry"}
NEAR_NEUTRAL_NRC = 0.2   # NRC between -0.2 and 0.2
NEAR_NEUTRAL_WAR = 1.0   # Warriner between 4 and 6
MAX_OUTER = 3          # Lucas, 2026-11-20: never 4, and 3 only when the third word earns its place

# Nouns have no "I was ___" form, so they're judged by the "feel" count alone.
NOUNS = {"Love", "Joy", "Awe", "Affection", "Tenderness", "Compassion", "Sympathy", "Desire",
         "Grief", "Heartache", "Dread", "Rage", "Contempt", "Hatred", "Remorse", "Regret", "Cringe"}

# Phrases that aren't the feeling, subtracted from a count (src/data/README.md, "Usage"). Each is
# named in the reason the change gives for the word. If they're most of a count, it's dropped.
NOT_FEELINGS = {
    "Used": ["I was used to"],
    "Exposed": ["I was exposed to"],
    "Accepted": ["I was accepted into", "I was accepted to", "I was accepted at", "I was accepted by"],
    # Synonym candidates, keyed in lowercase (src/data/README.md, "What the research supports"):
    # "afraid that" is a hedge, and "feel sorry for" is 98% of "feel sorry" (pity, not regret).
    "afraid": ["I was afraid that"],
    "sorry": ["feel sorry for", "feeling sorry for", "felt sorry for", "I was sorry for"],
}

# A wrong-side pleasantness result cleared by a recorded reason (src/data/README.md, "Pleasantness").
PLEASANTNESS_REASONS = {}

# For the unscored hint: a base form the lists may score.
BASE_FORMS = {"Cheated": "cheat", "Empowered": "empowerment", "Cared for": "care", "Attracted": "attraction",
              "Accepted": "acceptance", "Pressured": "pressure", "Conflicted": "conflict", "Insulted": "insult",
              "Disillusioned": "disillusionment", "Repulsed": "repulsive", "Possessive": "possession",
              "Out of place": "misplaced", "Burned out": "burnout", "Thrilled": "thrill"}
# Words on the wheel twice on purpose (src/data/README.md, Always 3): each meaning under the core its own users would tap.
SPLITS = {"disgusted", "betrayed", "empty"}  # Lucas, 2026-11-22: Disgusted physical under Bad, moral under Angry; Betrayed under Sad and Angry, and Empty under Bad and Sad, as people split
MIN_OUTER = 2

# Words whose counts can't measure them, kept by Lucas's decision.
COUNT_EXEMPT = {
    "Cringe": "Lucas, 2026-11-20: chosen over 'Embarrassed for them'; books barely use it, so the counts can't measure it",
}

# Synonym candidates the reasons list: a plainer or more usual word for the same feeling.
ALTERNATIVES = {
    "Scared": ["afraid", "fear", "fearful", "frightened"],
    "Angry": ["mad"], "Sad": ["unhappy", "down"], "Love": ["loving"],
    "Joy": ["joyful"], "Delighted": ["pleased"], "Elated": ["overjoyed", "ecstatic"],
    "Excited": ["excitement"], "Eager": ["enthusiastic"], "Proud": ["pride"],
    "Valued": ["appreciated", "respected"], "Brave": ["courageous"],
    "Content": ["contented"], "Satisfied": ["content"],
    "At peace": ["peaceful", "serene"], "Relaxed": ["at ease"], "Safe": ["secure"],
    "Relieved": ["relief"], "Hopeful": ["hope"], "Interested": ["curious"],
    "Curious": ["curiosity", "inquisitive"], "Intrigued": ["fascinated"],
    "Amazed": ["astonished"], "Awe": ["awed", "in awe"],
    "Affection": ["affectionate", "fond", "fondness", "warmth"],
    "Tenderness": ["tender"], "Compassion": ["compassionate", "caring"],
    "Sympathy": ["sympathetic"], "Heartache": ["sorrow", "heartsick"],
    "Sorry for someone": ["pity", "sad for"], "Apologetic": ["sorry"],
    "Burned out": ["burnt out"], "Overwhelmed": ["stressed"], "Suspicious": ["distrustful", "wary"],
    "Terrified": ["terror", "petrified"], "Frantic": ["desperate"], "Exhilarated": ["thrilled"],
    "Nostalgic": ["nostalgia", "sentimental"], "Accepted": ["included", "welcome"],
    "Desire": ["passion", "passionate"], "Attracted": ["infatuated", "smitten"],
    "Grateful": ["thankful", "gratitude"], "Moved": ["touched"], "Blessed": ["lucky"],
    "Lonely": ["loneliness", "isolated"], "Left out": ["excluded", "ignored"],
    "Grief": ["grieving", "sadness"], "Devastated": ["crushed"],
    "Hopeless": ["despair"], "Down": ["depressed", "gloomy", "blue"],
    "Ashamed": ["shame"], "Guilty": ["guilt", "sorry"],
    "Remorse": ["remorseful"], "Regret": ["regretful"],
    "Embarrassed": ["embarrassment"], "Foolish": ["stupid"],
    "Self-conscious": ["self conscious"],
    "Anxious": ["anxiety"], "Panicked": ["panic"],
    "Horrified": ["horror"], "Helpless": ["powerless"], "Threatened": ["unsafe"],
    "Insecure": ["self-doubt"], "On edge": ["tense", "jittery"], "Indignant": ["outraged"],
    "Annoyed": ["irritated"], "Irritable": ["grumpy", "cranky"],
    "Fed up": ["exasperated"], "Furious": ["livid", "enraged", "fury"],
    "Rage": ["enraged"], "Outraged": ["indignant"], "Hatred": ["hate", "hateful"],
    "Resentful": ["bitter"], "Unappreciated": ["taken for granted"],
    "Jealous": ["jealousy"], "Envious": ["envy"],
    "Disgusted": ["disgust"], "Repulsed": ["grossed out", "revolted", "sickened"],
    "Contempt": ["contemptuous"], "Bored": ["boredom"],
    "Unmotivated": ["listless", "apathetic"], "Indifferent": ["apathetic"],
    "Stressed": ["stress"], "Confused": ["confusion"], "Conflicted": ["torn"],
    "Puzzled": ["unsure", "uncertain"], "Uncomfortable": ["unsettled", "off"],
}


# Feeling words considered for the wheel and left out (from the opinionated wheel's working notes, 2026-11-22),
# so the synonym flag counts them as feeling words.
CONSIDERED = {
    "adoration", "affectionate", "alarmed", "alive", "apathetic", "appreciated", "appreciative",
    "astonished", "at ease", "at home", "belittled", "bitter", "bittersweet", "blue", "busy", "capable",
    "caring", "cherished", "close", "compassionate", "crushed", "desired", "despair", "desperate", "devoted",
    "devotion", "dismayed", "disrespected", "distrustful", "eager", "empathy", "enraged", "enthusiastic",
    "exasperated", "faithful", "fascinated", "fearful", "flat", "fondness", "frazzled", "giddy", "glad",
    "gloomy", "grieving", "gross", "grossed out", "heartsick", "hostile", "ignored", "included", "indebted",
    "infatuated", "inquisitive", "irritated", "isolated", "jittery", "joyful", "livid", "loathing", "lucky",
    "mad", "neglected", "off", "overjoyed", "paralyzed", "passion", "peaceful", "petrified", "pity",
    "pleased", "possessive", "powerless", "prepared", "regretful", "remorseful", "respected", "revolted",
    "sad for", "secure", "self-conscious", "self-doubt", "sentimental", "serene", "shaken", "sick", "silly",
    "skeptical", "smitten", "sorrow", "special", "spiteful", "stupid", "supported", "tender", "tense",
    "thankful", "torn", "touched", "trusted", "trusting", "uncertain", "unloved", "unsafe", "unsettled",
    "unsure", "unwanted", "upset", "useless", "vengeful", "wanted", "warm", "wary", "weak",
}


def load_wheel():
    """The app's feelings wheel as {"cores": [{"label", "middle": [{"label", "outer": [labels]}]}]}."""
    with open(os.path.join(REPO, "src", "data", "wheels", "core.json"), encoding="utf-8") as f:
        core = json.load(f)
    with open(os.path.join(REPO, "src", "data", "locales", "en.json"), encoding="utf-8") as f:
        labels = {k: v["label"] for k, v in json.load(f)["feelings"].items()}
    return {"cores": [
        {"label": labels[c["feeling"]], "middle": [
            {"label": labels[m["feeling"]], "outer": [labels[o["feeling"]] for o in m.get("children", [])]}
            for m in c["children"]]}
        for c in core["children"]]}


def feeling_vocabulary(wheel):
    """Words that count as feeling words for the synonym flag: the wheel, the synonym
    candidates, and the words considered and left out."""
    vocab = set(CONSIDERED)
    for core in wheel["cores"]:
        vocab.add(core["label"].lower())
        for mid in core["middle"]:
            vocab.add(mid["label"].lower())
            vocab.update(o.lower() for o in mid["outer"])
    for alts in ALTERNATIVES.values():
        vocab.update(a.lower() for a in alts)
    return vocab


def load_swow(cues):
    path = os.path.join(lex.DATA, "swow", "strength.SWOW-EN.R123.20180827.csv")
    out = {c: [] for c in cues}
    with open(lex.need(path), encoding="utf-8", newline="") as f:
        next(f)
        for line in f:
            cue, resp, _, _, strength = line.rstrip("\n").split("\t")
            if cue in out:
                out[cue].append((float(strength), resp))
    return {c: sorted(v, reverse=True)[:SWOW_TOP] for c, v in out.items()}


def base_key(label, labels):
    """Love and Loved are the same word (src/data/README.md, "Once")."""
    w = label.lower()
    for suffix in ("d", "ed"):
        if w.endswith(suffix) and w[: -len(suffix)] in labels:
            return w[: -len(suffix)]
    return w


def main():
    wheel = load_wheel()
    nrc, war, bc = lex.load_nrc(), lex.load_warriner(), lex.load_baron_cohen()

    entries = []  # (core, ring, parent, word)
    for core in wheel["cores"]:
        entries.append((core["label"], "core", "-", core["label"]))
        for mid in core["middle"]:
            entries.append((core["label"], "middle", core["label"], mid["label"]))
            for out in mid["outer"]:
                entries.append((core["label"], "outer", mid["label"], out))
    on_wheel = {e[3].lower() for e in entries}

    vocab = feeling_vocabulary(wheel) - on_wheel
    swow = load_swow({e[3].lower() for e in entries} | vocab)

    def same_side(a, b):
        sa, sb = nrc.get(a), nrc.get(b)
        return sa is not None and sb is not None and (sa > 0) == (sb > 0)

    candidates = {}
    for _, _, _, word in entries:
        w = word.lower()
        cands = [a.lower() for a in ALTERNATIVES.get(word, [])]
        # An association is only a synonym candidate when it runs both ways and the
        # two words are on the same side: "tired" is linked to "relaxed", but isn't it.
        cands += [r for _, r in swow.get(w, []) if r in vocab and same_side(w, r)
                  and w in {x for _, x in swow.get(r, [])}]
        candidates[word] = [c for c in dict.fromkeys(cands) if c not in on_wheel]

    def spelled(word):
        return COUNT_AS.get(word, word)

    needed = []
    for _, _, _, word in entries:
        needed += ngrams.phrases_for(spelled(word)) + [ngrams.was_phrase(spelled(word))] + NOT_FEELINGS.get(word, [])
        for c in candidates[word]:
            needed += ngrams.phrases_for(c) + [ngrams.was_phrase(c)] + NOT_FEELINGS.get(c, [])
    cache = ngrams.ensure(needed, ngrams.load_cache())

    def counts(word, noun):
        """The two counts, less phrases that aren't the feeling. None where a count doesn't apply."""
        feel = sum(cache.get(p, 0.0) for p in ngrams.phrases_for(spelled(word)))
        was = None if noun else cache.get(ngrams.was_phrase(spelled(word)), 0.0)
        notes = []
        not_feel = [p for p in NOT_FEELINGS.get(word, []) if not p.startswith(ngrams.WAS)]
        if not_feel and feel is not None:
            n = sum(cache.get(p, 0.0) for p in not_feel)
            if n > feel / 2:
                notes.append(f"'feel' dropped: {', '.join(repr(p) for p in not_feel)} are {n:.0f} of {feel:.0f}")
                feel = None
            else:
                feel -= n
        for phrase in NOT_FEELINGS.get(word, []):
            n = cache.get(phrase, 0.0)
            if phrase.startswith(ngrams.WAS) and was is not None:
                if n > was / 2:
                    notes.append(f"'I was' dropped: '{phrase}' is {n:.0f} of {was:.0f}")
                    was = None
                else:
                    was -= n
        return feel, was, notes

    def lookup(table, word):
        # As written, lowercase, the hyphen as a space, and the hyphen removed.
        w = LOOKUP_AS.get(word, word)
        for k in (w, w.lower(), w.lower().replace("-", " "), w.lower().replace("-", "")):
            if k in table:
                return table[k]
        return None

    flags, fails, noted, rows, three = [], [], [], [], []
    ring_counts = {"core": 0, "middle": 0, "outer": 0}

    for core, ring, parent, word in entries:
        ring_counts[ring] += 1
        where = f"{core} > {parent} > {word}" if ring == "outer" else (f"{core} > {word}" if ring == "middle" else word)
        pleasant = core in PLEASANT
        n, wv = lookup(nrc, word), lookup(war, word)
        sides = []
        if n is not None:
            sides.append((n > 0) == pleasant)
        if wv is not None:
            sides.append((wv[0] > 5) == pleasant)
        note = []
        if not sides:
            base = BASE_FORMS.get(word)
            hint = ""
            if base:
                bn, bw = lookup(nrc, base), lookup(war, base)
                hint = f"; {base} " + "/".join(x for x in (
                    "" if bn is None else f"{bn:+.2f}", "" if bw is None else f"{bw[0]:.2f}") if x)
            note.append("unscored")
            flags.append(f"pleasantness: {where} is unscored in both lists{hint}")
        elif not any(sides):
            if word in PLEASANTNESS_REASONS:
                noted.append(f"pleasantness: {where} is on the other side, cleared: {PLEASANTNESS_REASONS[word]}")
            else:
                fails.append(f"pleasantness: {where} is on the other side from {core} in every list that scores it")
            note.append("other side")
        elif not all(sides):
            note.append("lists disagree")
            flags.append(f"pleasantness: the lists disagree on {where}")
        if (n is not None and abs(n) < NEAR_NEUTRAL_NRC) or (wv is not None and abs(wv[0] - 5) < NEAR_NEUTRAL_WAR):
            note.append("near neutral")
            flags.append(f"pleasantness: {where} is near neutral")

        noun = word in NOUNS
        feel, was, count_notes = counts(word, noun)
        note += count_notes
        known = [c for c in (feel, was) if c is not None]
        shown = f"{'-' if feel is None else f'{feel:.1f}'} / {'noun' if noun else ('-' if was is None else f'{was:.1f}')}"
        if word in COUNT_EXEMPT:
            noted.append(f"usage: {word} ({shown}) is exempt: {COUNT_EXEMPT[word]}")
        elif known and all(c < RARE for c in known):
            flags.append(f"rare: {where} ({shown}) is under {RARE:g} per billion in every count")
        alt_txt = []
        for cand in ([] if word in COUNT_EXEMPT else candidates[word]):
            c_noun = noun
            cf, cw, _ = counts(cand, c_noun)
            alt_txt.append(f"{cand} {'-' if cf is None else f'{cf:.0f}'}/{'-' if cw is None else f'{cw:.0f}'}")
            pairs = [(a, b) for a, b in ((feel, cf), (was, cw)) if a is not None and b is not None]
            if pairs and all(b >= SYNONYM_RATIO * max(a, 0.01) for a, b in pairs):
                ratio = ", ".join(f"{b / max(a, 0.01):.1f}x" for a, b in pairs)
                flags.append(f"synonym: '{cand}' ({'-' if cf is None else f'{cf:.0f}'} / {'-' if cw is None else f'{cw:.0f}'}) "
                             f"is used {ratio} as often as {where} ({shown}); same meaning?")
        ratio = "" if feel is None or was is None or was == 0 else f"{feel / was:.1f}"
        rows.append((core, ring, parent, word,
                     "" if n is None else f"{n:+.2f}",
                     "" if wv is None else f"{wv[0]:.2f}",
                     "" if feel is None else f"{feel:.1f}",
                     "noun" if noun else ("" if was is None else f"{was:.1f}"),
                     ratio, "; ".join(note), "; ".join(alt_txt)))

    for core in wheel["cores"]:
        label = core["label"]
        if len(core["middle"]) < 4:
            flags.append(f"core: {label} has only {len(core['middle'])} middle words; its reason needs a line")
        b = bc.get(label.lower())
        if b is None:
            flags.append(f"core label: Baron-Cohen does not list {label}")
        elif b[0] < 75:
            flags.append(f"core label: only {b[0]:g}% of 4- to 6-year-olds knew {label}")
        for mid in core["middle"]:
            n_out = len(mid["outer"])
            if n_out > MAX_OUTER:
                fails.append(f"layout: {label} > {mid['label']} has {n_out} outer words; the limit is {MAX_OUTER} "
                             f"({', '.join(mid['outer'])})")
            elif n_out < MIN_OUTER:
                fails.append(f"layout: {label} > {mid['label']} has {n_out} outer word(s); it needs {MIN_OUTER}")
            elif n_out == MAX_OUTER:
                three.append(f"{label} > {mid['label']}: {', '.join(mid['outer'])}")

    seen = {}
    for core, ring, parent, word in entries:
        seen.setdefault(base_key(word, on_wheel), []).append(f"{core}/{parent}/{word}")
    for w, where in seen.items():
        if len(where) > 1 and not (w in SPLITS and len(where) == 2):
            fails.append(f"once: {w} appears {len(where)} times: {where}")

    print("core|ring|parent|word|NRC|Warriner|feel|I was|feel / I was|notes|synonym candidates (feel/I was)")
    for r in rows:
        print("|".join(r))
    print()
    print("Core labels, Baron-Cohen % knew at ages 4-6/7-8/9-10/11-12/13-14/15-16:")
    for core in wheel["cores"]:
        b = bc.get(core["label"].lower())
        print(f"  {core['label']}: {'/'.join(f'{x:g}' for x in b) if b else 'not listed'}")
    for alt in ["afraid", "frightened", "fear", "glad", "unhappy", "surprised", "disgust", "love"]:
        b = bc.get(alt)
        print(f"  ({alt}): {'/'.join(f'{x:g}' for x in b) if b else 'not listed'}")
    print()
    print(f"Words: {ring_counts}, total {sum(ring_counts.values())}")
    print()
    print(f"Middle words with {MAX_OUTER} outer words ({len(three)}); each third word needs a reason:")
    for t in three:
        print("  " + t)
    for title, items in (("NOTED", noted), ("FLAGS", flags), ("FAILURES", fails)):
        print()
        print(f"{title} ({len(items)}):")
        for f in items:
            print("  " + f)
        if not items:
            print("  none")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
