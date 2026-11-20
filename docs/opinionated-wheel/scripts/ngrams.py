"""Rule 10 phrase counts from the Google Books Ngram JSON endpoint.

Usage: python3 -I ngrams.py WORDLIST.txt
WORDLIST has one word or short phrase per line (as it would follow "I feel").
For each, sums the mean 2018-2022 frequency of "feel X", "feeling X" and "felt X"
in the English corpus, and stores it in ngram-cache.json next to this script,
in phrases per billion n-grams of the same length. Already-cached phrases are
not fetched again. About 12 phrases per request, one second between requests.
"""
import json
import os
import sys
import time
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "ngram-cache.json")
URL = "https://books.google.com/ngrams/json?content={}&year_start=2018&year_end=2022&corpus=en&smoothing=0"
FRAMES = ["feel", "feeling", "felt"]


def load_cache():
    if os.path.exists(CACHE):
        with open(CACHE, encoding="utf-8") as f:
            return json.load(f)
    return {}


def fetch(phrases):
    # Ask with the hyphen joined ("self-conscious"); the reply spells it "self - conscious".
    q = ",".join(urllib.parse.quote_plus(p.replace(" - ", "-")) for p in phrases)
    req = urllib.request.Request(URL.format(q), headers={"User-Agent": "word-check/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = json.loads(r.read().decode("utf-8"))
    out = {p: 0.0 for p in phrases}
    for item in data:
        ts = item.get("timeseries") or []
        if ts and item.get("ngram") in out:
            out[item["ngram"]] = sum(ts) / len(ts) * 1e9
    return out


def phrases_for(word):
    # The Ngram corpus splits hyphenated words: "self-conscious" is "self - conscious".
    word = word.replace("-", " - ")
    return [f"{fr} {word}" for fr in FRAMES]


def score(cache, word):
    return sum(cache.get(p, 0.0) for p in phrases_for(word))


def main(path):
    words = [w.strip().lower() for w in open(path, encoding="utf-8") if w.strip() and not w.startswith("#")]
    cache = load_cache()
    todo = [p for w in words for p in phrases_for(w) if p not in cache]
    todo = list(dict.fromkeys(todo))
    # A hyphenated phrase only comes back when it is asked for on its own.
    plain = [p for p in todo if " - " not in p]
    batches = [plain[i:i + 12] for i in range(0, len(plain), 12)]
    batches += [[p] for p in todo if " - " in p]
    for batch in batches:
        for attempt in range(4):
            try:
                cache.update(fetch(batch))
                break
            except Exception as e:  # rate limits: back off and retry
                print("retry", attempt, e, file=sys.stderr)
                time.sleep(5 * (attempt + 1))
        with open(CACHE, "w", encoding="utf-8") as f:
            json.dump(cache, f, indent=0, sort_keys=True)
        time.sleep(1)
    for w in words:
        print(f"{w:22} {score(cache, w):10.2f}")


if __name__ == "__main__":
    main(sys.argv[1])
