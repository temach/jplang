#!/usr/bin/env python3
import json
import re
import os
import re
from urllib.parse import urlparse
from pathlib import Path
from datetime import datetime
from collections import defaultdict
from itertools import dropwhile

from bottle import response, request, post, get, route, run, template, HTTPResponse, static_file, redirect  # type: ignore
from typing import TypedDict, Any


class KeyCandidate(TypedDict):
    word: str
    metadata: str
    freq: list[int]


ListKeyCandidate = list[KeyCandidate]
Thesaurus = dict[str, list[str]]


@get("/")
def root():
    # find the language and redirect to that, otherwise relative paths break
    # language check order:
    # 0 - what language cookie you have
    cookie_lang = request.get_cookie("lang")
    if cookie_lang:
        return redirect(f"/{cookie_lang}/")

    # 1 - what does accept_language header have
    accept_language_header = request.headers.get("Accept-Language")
    if accept_language_header:
        m = re.match('[a-z]{2,3}', accept_language_header.strip(), flags=re.IGNORECASE)
        if m:
            return redirect(f"/{m.group()}/")

    # 2 - what domain are you targetting, useful for tools that normally dont supply accept_language header
    hostname = urlparse(request.headers.get("Host")).hostname
    if hostname:
        m = re.match('.*[.]([a-z0-9]+)$', hostname, flags=re.IGNORECASE)
        if m:
            return redirect(f"/{m.group()}/")

    # finally use english by default
    return redirect(f"/en/")


@get("/<lang>/")
@get("/<lang>/<filepath:re:.*\.(html|css|js)>")
def static(lang, filepath="index.html"):
    root = Path("../frontend/") / lang
    return static_file(filepath, root=root)


@get("/version")
def version():
    data = {"version": "0.1"}
    response.set_header("content-type", "application/json")
    return json.dumps(data)


def get_en_freq(word):
    return [
        CORPUS.get(word, -1),
        SUBS.get(word, -1)
    ]


@get("/api/suggestions/<kanji>")
def suggestions(kanji):
    res = inner_suggestions(kanji)
    response.set_header("content-type", "application/json")
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
    parser.add_argument('--port', type=int, default=80, help='port number')
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
