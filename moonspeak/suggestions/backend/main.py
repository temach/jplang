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
    def relative_redirect(url, code=307):
        # modified from bottle.py because redirects must be relative (without scheme://host/ )
        res = response.copy(cls=HTTPResponse)
        res.status = code
        res.body = ""
        res.set_header("Location", url)
        raise res

    def choose_lang(request):
        # find the language and redirect to that, otherwise relative paths break
        # language check order:
        # 0 - what language cookie you have
        cookie_lang = request.get_cookie("lang")
        if cookie_lang:
            return cookie_lang

        # 1 - what does accept_language header have
        accept_language_header = request.headers.get("Accept-Language")
        if accept_language_header:
            m = re.match(
                "[a-z]{2,3}", accept_language_header.strip(), flags=re.IGNORECASE
            )
            if m:
                return m.group()

        # 2 - what domain are you targetting, useful for tools that normally dont supply accept_language header
        hostname = urlparse(request.headers.get("Host")).hostname
        if hostname:
            m = re.match(".*[.]([a-z0-9]+)$", hostname, flags=re.IGNORECASE)
            if m:
                return m.group()

        # finally use english by default
        return "en"

    lang = choose_lang(request)

    # in dev mode, language dirs may be absent, then redirect to /localhost/
    langdir = Path(f"../frontend/dist/{lang}")
    if not langdir.exists():
        return relative_redirect("/localhost/", code=307)

    return relative_redirect(f"/{lang}/", code=307)


@get("/localhost/")
@get("/localhost/<filepath:re:.*\.(html|css|js)>")
def static(filepath="index.html"):
    # this is for dev mode only
    root = Path("../frontend/src/")
    return static_file(filepath, root=root)


@get("/<lang>/")
@get("/<lang>/<filepath:re:.*\.(html|css|js)>")
def static(lang, filepath="index.html"):
    root = Path("../frontend/dist/") / lang
    return static_file(filepath, root=root)


def get_en_freq(word):
    return CORPUS_AND_SUBS_WORDS.get(word, (-1, -1))


@get("/<lang>/api/suggestions/<kanji>")
def suggestions(lang, kanji):
    res = inner_suggestions(kanji)
    response.set_header("content-type", "application/json")
    return json.dumps(res)


def inner_suggestions(kanji) -> ListKeyCandidate:
    result = []

    if SCRIPTIN.get(kanji):
        u = SCRIPTIN[kanji]["uniq"]
        item: KeyCandidate = {
            "word": u,
            "freq": get_en_freq(u),
            "metadata": "scriptin-uniq",
        }
        result.append(item)

        for k in SCRIPTIN[kanji]["keys"]:
            item = {"word": k, "freq": get_en_freq(k), "metadata": "scriptin-keys"}
            result.append(item)

    if KANJIDIC.get(kanji):
        for m in KANJIDIC[kanji]:
            item = {"word": m, "freq": get_en_freq(m), "metadata": "kanjidic"}
            result.append(item)

    if KANJIDAMAGE.get(kanji):
        # regex test value: "understand/divide or minute / equal /etc./plural"
        # should be: ['understand', 'divide', 'minute ', 'equal ', 'etc', 'plural']
        kanjidamage_keywords = re.split(r"[,./]| or ", KANJIDAMAGE[kanji])
        for d in (m.strip() for m in kanjidamage_keywords if len(m) > 0):
            item = {"word": d, "freq": get_en_freq(d), "metadata": "kanjidamage"}
            result.append(item)

    return result


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Feature, run as "python main.py"')
    parser.add_argument(
        "--host",
        type=str,
        default=os.getenv("MOONSPEAK_HOST", "localhost"),
        help="host name to bind",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=os.getenv("MOONSPEAK_PORT", 8042),
        help="port number",
    )
    args = parser.parse_args()

    # english frequency
    CORPUS_AND_SUBS_WORDS = dict()
    # kanji keyword suggestions
    KANJIDIC = {}
    SCRIPTIN = {}
    KANJIDAMAGE = {}

    with open("../resources/english-from-subtitles-by-freq.txt", encoding="utf-8") as f:
        for number, line in enumerate(f, start=1):
            word = line.split()[0].strip()
            CORPUS_AND_SUBS_WORDS[word] = (number, -1)

    with open(
        "../resources/english-from-gogle-corpus-by-freq.txt", encoding="utf-8"
    ) as f:
        for number, line in enumerate(f, start=1):
            word = line.split()[0].strip()
            if word in CORPUS_AND_SUBS_WORDS:
                CORPUS_AND_SUBS_WORDS[word] = (CORPUS_AND_SUBS_WORDS[word][0], number)
            else:
                CORPUS_AND_SUBS_WORDS[word] = (-1, number)

    with open(
        "../resources/keywords-kanjidic2-meanings.json", encoding="utf-8"
    ) as kanjidic:
        KANJIDIC = json.load(kanjidic)

    with open(
        "../resources/keywords-scriptin-kanji-keys.json", encoding="utf-8"
    ) as scriptin:
        SCRIPTIN = json.load(scriptin)

    with open(
        "../resources/keywords-kanjidamage-anki-cards.json", encoding="utf-8"
    ) as kanjidamage:
        KANJIDAMAGE = json.load(kanjidamage)

    print("Running bottle server on port {}".format(args.port))
    run(host=args.host, port=args.port)
