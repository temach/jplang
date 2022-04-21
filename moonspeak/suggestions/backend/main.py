#!/usr/bin/env python3
#!/usr/bin/env python3
import json
import re
import os
from datetime import datetime
from collections import defaultdict
from itertools import dropwhile

from bottle import request, post, get, route, run, template, HTTPResponse, static_file  # type: ignore
from typing import TypedDict, Any


class KeyCandidate(TypedDict):
    word: str
    metadata: str
    freq: list[int]


ListKeyCandidate = list[KeyCandidate]
Thesaurus = dict[str, list[str]]


@get("/")
def index():
    return static_file("index.html", root="../frontend/")

@get("/static/<filepath:re:.*\.(css|js)>")
def static(filepath):
    return static_file(filepath, root="../frontend/static/")


@get("/version")
def version():
    data = {"version": "0.1"}
    return json.dumps(data)


def get_en_freq(word):
    return [
        CORPUS.get(word, -1),
        SUBS.get(word, -1)
    ]

@get("/api/suggestions/<kanji>")
def suggestions(kanji):
    res = inner_suggestions(kanji)
    return json.dumps(res)


def inner_suggestions(kanji) -> ListKeyCandidate:
    result = []

    u = SCRIPTIN[kanji]["uniq"]
    item: KeyCandidate = {
        "word": u,
        "freq": get_en_freq(u),
        "metadata": "scriptin-uniq"
    }
    result.append(item)

    for k in SCRIPTIN[kanji]["keys"]:
        item = {
            "word": k,
            "freq": get_en_freq(k),
            "metadata": "scriptin-keys"
        }
        result.append(item)

    for m in KANJIDIC[kanji]:
        item = {
            "word": m,
            "freq": get_en_freq(m),
            "metadata": "kanjidic"
        }
        result.append(item)

    # regex test value: "understand/divide or minute / equal /etc./plural"
    # should be: ['understand', 'divide', 'minute ', 'equal ', 'etc', 'plural']
    kanjidamage_keywords = re.split(r"[,./]| or ", KANJIDAMAGE[kanji])
    for d in (m.strip() for m in kanjidamage_keywords if len(m) > 0):
        item = {
            "word": d,
            "freq": get_en_freq(d),
            "metadata": "kanjidamage"
        }
        result.append(item)

    return result


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Feature, run as "python main.py"')
    parser.add_argument('port', type=int, help='port number')
    args = parser.parse_args()

    # english frequency
    CORPUS = {}
    SUBS = {}
    # kanji keyword suggestions
    KANJIDIC = {}
    SCRIPTIN = {}
    KANJIDAMAGE = {}

    with open("../resources/english-from-gogle-corpus-by-freq.txt") as f:
        for number, line in enumerate(f, start=1):
            word = line.split()[0].strip()
            CORPUS[word] = number

    with open("../resources/english-from-subtitles-by-freq.txt") as f:
        for number, line in enumerate(f, start=1):
            word = line.split()[0].strip()
            SUBS[word] = number

    with open("../resources/keywords-kanjidic2-meanings.json") as kanjidic:
        KANJIDIC = json.load(kanjidic)

    with open("../resources/keywords-scriptin-kanji-keys.json") as scriptin:
        SCRIPTIN = json.load(scriptin)

    with open("../resources/keywords-kanjidamage-anki-cards.json") as kanjidamage:
        KANJIDAMAGE = json.load(kanjidamage)

    print("Running bottle server on port {}".format(args.port))
    run(host="0.0.0.0", port=args.port, debug=True)
