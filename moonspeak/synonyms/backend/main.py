#!/usr/bin/env python3
import json
import re
import os
from datetime import datetime
from collections import defaultdict
from itertools import dropwhile

from bottle import response, request, post, get, route, run, template, HTTPResponse, static_file  # type: ignore
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
    response.set_header("content-type", "application/json")
    return json.dumps(data)


def get_en_freq(word):
    return [
        CORPUS.get(word, -1),
        SUBS.get(word, -1)
    ]

@get("/api/synonyms/<word>")
def synonyms(word):
    res = inner_synonyms(word)
    response.set_header("content-type", "application/json")
    return json.dumps(res)


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

    # sort according to popularity
    ordered = sorted(
        result.values(),
        key=lambda item: int(item["metadata"]),
        reverse=True
    )

    return ordered


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Feature, run as "python main.py"')
    parser.add_argument('--port', default=80, type=int, help='port number')
    args = parser.parse_args()

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

    print("Running bottle server on port {}".format(args.port))
    run(host="0.0.0.0", port=args.port, debug=True)
