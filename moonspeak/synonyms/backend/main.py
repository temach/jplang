#!/usr/bin/env python3
import json
import re
from urllib.parse import urlparse
import os
from pathlib import Path
from collections import defaultdict

from flask import Flask, send_from_directory, make_response, request, redirect  # type: ignore
from typing import TypedDict, Any

class KeyCandidate(TypedDict):
    word: str
    metadata: str
    freq: list[int]


ListKeyCandidate = list[KeyCandidate]
Thesaurus = dict[str, list[str]]
app = Flask(__name__, static_folder=None)


def get_en_freq(word):
    return [
        CORPUS.get(word, -1),
        SUBS.get(word, -1)
    ]


@app.get("/<lang>/api/synonyms/<word>")
def synonyms(lang, word):
    res = inner_synonyms(word)
    response = make_response(json.dumps(res), 200, {"Content-Type": "application/json"})
    return response


def inner_synonyms(word) -> ListKeyCandidate:
    # usefull thesaurus sources: https://github.com/Ron89/thesaurus_query.vim

    # Big Huge Thesaurus:
    # https://github.com/tttthomasssss/PyHugeThesaurusConnector
    # Key:
    # 56d5758eb85511ea73b9ab65436761c2
    # e.g: https://words.bighugelabs.com/api/2/56d5758eb85511ea73b9ab65436761c2/word/json

    # Maryam webster keys:
    # https://github.com/PederHA/mwthesaurus
    # Key (Thesaurus):
    # fb5b269d-867b-4401-85a0-777436d9c033
    # Key (Intermediate Thesaurus):
    # 72e1d7bf-09a3-43ef-9dae-17989dc6d355

    # return json.dumps([{"word": "artem", "metadata": "artem", "freq": (10, 10)}])

    word = word.lower()
    result = {}
    popularity: dict[str, int] = defaultdict(int)

    for thesaurus in [MOBY, OPENOFFICE, WORDNET]:
        for w in thesaurus.get(word, []):
            # check that word is not obscure, it should be present in both google and subs corpus
            freq = get_en_freq(w)
            if (freq[0] < 0 and freq[1] < 0):
                continue
            # build the item
            item: KeyCandidate = {
                "word": w,
                "freq": freq,
                "metadata": ""
            }
            # save the item
            result[w] = item
            # everytime the word appears in a different thesaurus, increase its popularity
            popularity[w] += 1

    for w in result.keys():
        result[w]["metadata"] = str(popularity[w])

    # this constant is an impossibly large frequency value used to build the composite sorting key
    max_freq = 1000000000

    # sort according to popularity, and within each popularity grade sort according to word freq
    ordered = sorted(
        result.values(),
        key=lambda item: int(item["metadata"]) * max_freq + sum(item["freq"]),
        reverse=True
    )

    return ordered


@app.get("/")
def root():

    def choose_lang(request):
        # find the language and redirect to that, otherwise relative paths break
        # language check order:
        # 0 - what language cookie you have
        cookie_lang = request.cookies.get("lang")
        if cookie_lang:
            return cookie_lang

        # 1 - what does accept_language header have
        accept_language_header = request.headers.get("Accept-Language")
        if accept_language_header:
            m = re.match('[a-z]{2,3}', accept_language_header.strip(), flags=re.IGNORECASE)
            if m:
                return m.group()

        # 2 - what domain are you targetting, useful for tools that normally dont supply accept_language header
        hostname = urlparse(request.headers.get("Host")).hostname
        if hostname:
            m = re.match('.*[.]([a-z0-9]+)$', hostname, flags=re.IGNORECASE)
            if m:
                return m.group()

        # finally use english by default
        return "en"

    lang = choose_lang(request)

    # in dev mode, language dirs may be absent, then redirect to /localhost/
    langdir = Path(f"../frontend/dist/{lang}")
    if not langdir.exists():
        return redirect("/localhost/", code=307)

    return redirect(f"/{lang}/", code=307)


@app.get("/<lang>/")
@app.get("/<lang>/<path:filepath>")
def static(lang, filepath="index.html"):
    root = Path("../frontend/dist/") / lang
    if lang == "localhost":
        # this is for dev mode only
        root = Path("../frontend/src/")
    return send_from_directory(root, filepath)


if __name__ == "__main__":
    # english frequency
    CORPUS = {}
    SUBS = {}
    # thesaurus
    WORDNET: Thesaurus = {}
    MOBY: Thesaurus = {}
    OPENOFFICE: Thesaurus = {}

    with open("../resources/english-from-gogle-corpus-by-freq.txt") as f:
        for number, line in enumerate(f, start=1):
            word = line.split()[0].strip()
            CORPUS[word] = number

    with open("../resources/english-from-subtitles-by-freq.txt") as f:
        for number, line in enumerate(f, start=1):
            word = line.split()[0].strip()
            SUBS[word] = number

    with open("../resources/english-thesaurus-moby-mthesaur.txt") as f:
        for line in f:
            line = line.lower()
            key = line.split(',')[0]
            synonyms = line.split(',')[1:]
            MOBY[key] = synonyms

    with open("../resources/english-thesaurus-openoffice.txt") as f:
        lines = f.readlines()
        i = 1
        while i < len(lines):
            line = lines[i].lower()
            key, n_meanings = line.split('|')
            meanings = set()
            for k in range(int(n_meanings)):
                l = lines[i + k].lower()
                meaning_line = l.split('|')[1:]
                meanings.update(meaning_line)
            OPENOFFICE[key] = list(meanings)
            i += 1 + int(n_meanings)

    with open("../resources/english-thesaurus-wordnet.jsonl") as f:
        for line in f:
            data = json.loads(line)
            key = data["word"].lower()
            synonyms = data["synonyms"]
            if key in WORDNET:
                WORDNET[key].extend(synonyms)
            else:
                WORDNET[key] = synonyms
