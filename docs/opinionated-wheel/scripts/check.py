"""Mechanical checks for docs/opinionated-wheel/derived-wheel.json.

Usage: python3 -I check.py
Reads the wheel, situations.json, ngram-cache.json (run ngrams.py first) and the
datasets through lex.py's loaders. Prints a per-word table and every flag.

Rules checked:
  1  valence side against the core in NRC VAD v2.1 (sign) and Warriner 2013 (5 = neutral)
  5  each core has 4+ middle words; core labels known by young children (Baron-Cohen 2010)
  9  each word once
 10  phrase count ("feel/feeling/felt X", 2018-2022) and plainer words used ~5x as often
 13  every situation's feeling is on the wheel
 and: each middle word has 2 or 3 outer words, never more (the layout limit).

Failures (exit status 1): a middle word with more than 3 or fewer than 2 outer
words, a word on the wheel twice (rule 9), and a situation with no word (rule 13).
Everything else is a flag: kept only with a written reason in derived-wheel.md.
"""
import importlib.util
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

spec = importlib.util.spec_from_file_location("lex", os.path.join(HERE, "lex.py"))
lex = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lex)

PLEASANT = {"Happy", "Love"}
BARELY_USED = 5.0      # phrases per billion; Detestable scores 0, Inquisitive 1.2
LOW_USE = 15.0         # under this, the word needs a written reason (the "feel ___" frame undercounts "I'm ___")

# Labels whose counts or valence come from a shorter form.
COUNT_AS = {"Sorry for someone": "sorry for"}
LOOKUP_AS = {"Sorry for someone": "sorry"}
NEAR_NEUTRAL_NRC = 0.15
NEAR_NEUTRAL_WAR = 0.5
MAX_OUTER = 3          # Lucas, 2026-11-20: never 4, and 3 only when the third word earns its place
# Words on the wheel twice on purpose (rules.md, Always 3): each meaning under the core its own users would tap.
SPLITS = {"disgusted", "betrayed"}  # Lucas, 2026-11-22: Disgusted physical under Bad, moral under Angry; Betrayed under Sad and Angry, as people split
MIN_OUTER = 2

# Words whose phrase count can't measure them, kept by Lucas's decision.
COUNT_EXEMPT = {
    "Cringe": "Lucas, 2026-11-20: chosen over 'Embarrassed for them'; books barely use it, so rule 10's counts can't measure it",
}

# Rule 10: a plainer or more usual word for the same feeling.
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


def main():
    wheel = json.load(open(os.path.join(ROOT, "derived-wheel.json"), encoding="utf-8"))
    situations = json.load(open(os.path.join(HERE, "situations.json"), encoding="utf-8"))
    cache = json.load(open(os.path.join(HERE, "ngram-cache.json"), encoding="utf-8"))
    nrc, war, bc = lex.load_nrc(), lex.load_warriner(), lex.load_baron_cohen()

    def lookup(table, word):
        # NRC and Warriner spell some hyphenated words with a space ("self conscious").
        k = LOOKUP_AS.get(word, word).lower()
        if k in table:
            return table[k]
        return table.get(k.replace("-", " "))

    def count(word):
        w = COUNT_AS.get(word, word).lower().replace("-", " - ")
        keys = [f"{f} {w}" for f in ("feel", "feeling", "felt")]
        if not all(k in cache for k in keys):
            return None
        return sum(cache[k] for k in keys)

    flags, fails, noted, seen, rows = [], [], [], {}, []
    three = []
    counts = {"core": 0, "middle": 0, "outer": 0}

    def check_word(word, core, ring, parent):
        counts[ring] += 1
        seen.setdefault(word.lower(), []).append(f"{core}/{parent}")
        pleasant = core in PLEASANT
        n = lookup(nrc, word)
        wv = lookup(war, word)
        sides = []
        if n is not None:
            sides.append((n > 0) == pleasant)
        if wv is not None:
            sides.append((wv[0] > 5) == pleasant)
        note = ""
        if not sides:
            note = "NO-DATA"
        elif not any(sides):
            note = "WRONG-SIDE"
            flags.append(f"rule 1: {word} is on the wrong side of {core} in every list that has it")
        elif not all(sides):
            note = "LISTS-DISAGREE"
        near = (n is not None and abs(n) < NEAR_NEUTRAL_NRC) or (wv is not None and abs(wv[0] - 5) < NEAR_NEUTRAL_WAR)
        if near:
            note += " NEAR-NEUTRAL"
        c = count(word)
        if word in COUNT_EXEMPT:
            noted.append(f"rule 10: {word} ({0 if c is None else c:.2f}) is exempt: {COUNT_EXEMPT[word]}")
        elif c is None:
            flags.append(f"rule 10: {word} has no phrase count yet")
        elif c < BARELY_USED:
            flags.append(f"rule 10: {word} is barely used after feel/feeling/felt ({c:.1f})")
        elif c < LOW_USE:
            flags.append(f"rule 10 (needs a reason): {word} is under {LOW_USE:g} per billion ({c:.1f})")
        alt_txt = []
        for alt in ALTERNATIVES.get(word, []):
            ac = count(alt)
            if ac is None:
                continue
            alt_txt.append(f"{alt} {ac:.0f}")
            if c is not None and ac >= 4.5 * max(c, 0.01):
                flags.append(f"rule 10: '{alt}' ({ac:.1f}) is used {ac / max(c, 0.01):.1f}x as often as {word} ({c:.1f})")
        rows.append((core, ring, parent, word,
                     "" if n is None else f"{n:+.2f}",
                     "" if wv is None else f"{wv[0]:.2f}",
                     "" if c is None else f"{c:.1f}", note.strip(), "; ".join(alt_txt)))

    for core in wheel["cores"]:
        label = core["label"]
        check_word(label, label, "core", "-")
        if len(core["middle"]) < 4:
            flags.append(f"rule 5: {label} has only {len(core['middle'])} middle words")
        b = bc.get(label.lower())
        if b is None:
            flags.append(f"rule 5: Baron-Cohen does not list core label {label}")
        elif b[0] < 75:
            flags.append(f"rule 5: only {b[0]}% of 4-6 year olds knew {label}")
        for mid in core["middle"]:
            check_word(mid["label"], label, "middle", label)
            n_out = len(mid["outer"])
            if n_out > MAX_OUTER:
                fails.append(f"layout: {label} > {mid['label']} has {n_out} outer words; the limit is {MAX_OUTER} "
                             f"({', '.join(mid['outer'])})")
            elif n_out < MIN_OUTER:
                fails.append(f"layout: {label} > {mid['label']} has {n_out} outer word(s); it needs {MIN_OUTER}")
            elif n_out == MAX_OUTER:
                three.append(f"{label} > {mid['label']}: {', '.join(mid['outer'])}")
            for out in mid["outer"]:
                check_word(out, label, "outer", mid["label"])

    for w, where in seen.items():
        if len(where) > 1 and not (w in SPLITS and len(where) == 2):
            fails.append(f"rule 9: {w} appears {len(where)} times: {where}")

    # Each situation: [source, area, situation, feeling, covered-by?, reason?]
    on_wheel = set(seen)
    missing, mapped, gaps = [], [], []
    covered = set()
    for row in situations:
        src, area, text, feeling = row[:4]
        if feeling.lower() in on_wheel:
            covered.add(feeling.lower())
        elif len(row) > 4 and row[4] and row[4].lower() in on_wheel:
            covered.add(row[4].lower())
            mapped.append(f"{feeling} -> {row[4]} ({row[5]})")
        elif len(row) > 4 and row[4] is None:
            gaps.append(f"{feeling}: '{text}' ({row[5]})")
        else:
            missing.append(row)
            fails.append(f"rule 13: '{text}' ({src}) needs {feeling}, which is not on the wheel")

    print("core|ring|parent|word|NRC|Warriner|feel-count|valence note|alternatives (count)")
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
    print(f"Words: {counts}, total {sum(counts.values())}")
    by_src = {}
    for row in situations:
        by_src[row[0]] = by_src.get(row[0], 0) + 1
    print(f"Situations: {len(situations)} {by_src}; unplaced {len(missing)}; named by another word {len(mapped)}; gaps the rules forbid filling {len(gaps)}")
    for m in mapped:
        print("  mapped: " + m)
    for g in gaps:
        print("  gap: " + g)
    print(f"Wheel words no situation names: {sorted(on_wheel - covered)}")
    print()
    print(f"Middle words with {MAX_OUTER} outer words ({len(three)}); each third word needs a reason in derived-wheel.md:")
    for t in three:
        print("  " + t)
    print()
    print("NOTED:")
    for f in noted:
        print("  " + f)
    if not noted:
        print("  none")
    print()
    print("FLAGS:")
    for f in flags:
        print("  " + f)
    if not flags:
        print("  none")
    print()
    print("FAILURES:")
    for f in fails:
        print("  " + f)
    if not fails:
        print("  none")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
