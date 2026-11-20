"""Look up words in the plain-text datasets (never executes anything downloaded).

Usage: python3 -I lex.py WORD [WORD ...]
Prints NRC VAD v2.1 valence (-1..1), Warriner 2013 valence (1..9, neutral 5),
and Baron-Cohen 2010 percent of children who knew the word, by age band.
"""
import csv
import html
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
# The datasets aren't in the repo (their licenses don't allow it). Download them
# (see ../learnings.md, "Data") and set WHEEL_DATA to the folder that holds them.
DATA = os.environ.get("WHEEL_DATA") or os.path.normpath(os.path.join(HERE, "..", "..", "data"))

NRC_PATH = os.path.join(DATA, "nrc-vad", "extracted", "NRC-VAD-Lexicon-v2.1", "NRC-VAD-Lexicon-v2.1.txt")
WAR_PATH = os.path.join(DATA, "warriner2013", "springer", "BRM-emot-submit.csv")
BC_PATH = os.path.join(DATA, "paper-fulltext", "baron-cohen-2010.xml")
BANDS = ["4-6", "7-8", "9-10", "11-12", "13-14", "15-16"]


def load_nrc():
    out = {}
    with open(NRC_PATH, encoding="utf-8") as f:
        next(f)
        for line in f:
            parts = line.rstrip("\n").split("\t")
            if len(parts) == 4:
                out[parts[0].lower()] = float(parts[1])
    return out


def load_warriner():
    out = {}
    with open(WAR_PATH, encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            out[row["Word"].lower()] = (float(row["V.Mean.Sum"]), float(row["V.SD.Sum"]))
    return out


def load_baron_cohen():
    s = open(BC_PATH, encoding="utf-8").read()
    i = s.find('<table-wrap id="T1"')
    j = s.find("</table-wrap>", i)
    body = s[i:j]
    out = {}
    for tr in re.findall(r"<tr>(.*?)</tr>", body, re.S):
        cells = [html.unescape(re.sub(r"<[^>]+>", "", c)).strip()
                 for c in re.findall(r"<td[^>]*>(.*?)</td>", tr, re.S)]
        if len(cells) == 8 and re.match(r"^\d+\.$", cells[0]):
            try:
                out[cells[1].lower()] = [float(x) for x in cells[2:]]
            except ValueError:
                pass
    return out


def main(words):
    nrc, war, bc = load_nrc(), load_warriner(), load_baron_cohen()
    for w in words:
        k = w.lower()
        n = nrc.get(k)
        wv = war.get(k)
        b = bc.get(k)
        print(f"{w:18} NRC={'' if n is None else f'{n:+.3f}':7} "
              f"WAR={'' if wv is None else f'{wv[0]:.2f}':5} "
              f"BC={'' if b is None else '/'.join(f'{x:g}' for x in b)}")


if __name__ == "__main__":
    main(sys.argv[1:])
