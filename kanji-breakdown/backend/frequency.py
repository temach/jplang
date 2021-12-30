#!/usr/bin/env python3
import os
import json
import re
from nltk.stem.porter import PorterStemmer  # type: ignore
from nltk.stem import WordNetLemmatizer  # type: ignore
from typing import TypedDict, Any
from typeguard import typechecked
from bottle import response

import zmq


def get_en_freq_regex(word):
    r = re.compile("^{}$".format(word), re.IGNORECASE)
    for icorpus, e in enumerate(CORPUS.keys()):
        if r.match(e):
            break

    for isubs, e in enumerate(SUBS.keys()):
        if r.match(e):
            break

    if icorpus == len(CORPUS.keys())-1:
        icorpus = -1

    if isubs == len(SUBS.keys())-1:
        isubs = -1

    return (icorpus, isubs)


def keyword_frequency(kanji, keyword):
    stem = STEMMER.stem(keyword)
    lemma = LEMMATIZER.lemmatize(keyword)
    conflict = ""

    # check for conflict with onyomi
    stem_onyomi_conflict = ONYOMI.get(stem, None)
    lemma_onyomi_conflict = ONYOMI.get(lemma, None)

    if stem_onyomi_conflict:
        conflict += "{} is an onyomi key. ".format(
            stem_onyomi_conflict)

    if lemma_onyomi_conflict and stem != lemma:
        conflict += "{} is an onyomi key. ".format(
            lemma_onyomi_conflict)

    # check for conflict with keywords
    # better checking than just a UNIQUE constraints in database
    stem_kanji, stem_keywords_conflict = KEYWORDS.get(stem, (None, None))
    lemma_kanji, lemma_keywords_conflict = KEYWORDS.get(lemma, (None, None))

    # assert that kanji is the same
    # there is an edge case: when building keywords from database
    # the stem for "child" is "child", so it gets inserted, but stem for
    # "children" is "children", but lemma for "children" is "child", so lemma is found
    # but stem is not
    if stem_kanji and lemma_kanji:
        assert stem_kanji == lemma_kanji

    if stem_keywords_conflict and stem_kanji != kanji:
        conflict += "{} is key for {}. ".format(
            stem_keywords_conflict, stem_kanji)

    if lemma_keywords_conflict and lemma_kanji != kanji and stem != lemma:
        conflict += "{} is key for {}. ".format(
            lemma_keywords_conflict, lemma_kanji)

    # check for conflict as substring, e.g. "fullfill" and "full" are too similar
    for substr_kanji, substr_key in KEYWORDS.values():
        if substr_key.startswith(keyword) and substr_kanji != kanji:
            # "and" condition to prevent matching itself
            conflict += "{} is key for {}. ".format(
                substr_key, substr_kanji)

    response = {
        "freq": get_en_freq_regex(keyword),
        "metadata": conflict,
    }
    return json.dumps(response, ensure_ascii=False)



if __name__ == "__main__":
    # to detect words that are already taken
    WORK = {}
    RADICALS = {}
    ONYOMI = {}

    # keywords taken from WORK but with stem and lemma versions
    KEYWORDS: dict[str, tuple[str, str]] = {}

    # english frequency
    CORPUS = {}
    SUBS = {}

    with open("../resources/kanji.json") as kanji:
        WORK = json.load(kanji)

    with open("../resources/radicals.json") as radicals:
        RADICALS = json.load(radicals)

    with open("../resources/english-from-gogle-corpus-by-freq.txt") as f:
        for number, line in enumerate(f, start=1):
            word = line.split()[0].strip()
            CORPUS[word] = number

    with open("../resources/english-from-subtitles-by-freq.txt") as f:
        for number, line in enumerate(f, start=1):
            word = line.split()[0].strip()
            SUBS[word] = number

    STEMMER = PorterStemmer()
    LEMMATIZER = WordNetLemmatizer()

    for data in WORK.values():
        kanji = data["kanji"]

        keyword = data["keyword"]
        new_stem = STEMMER.stem(keyword)
        new_lemma = LEMMATIZER.lemmatize(keyword)
        KEYWORDS[new_stem] = (kanji, keyword)
        KEYWORDS[new_lemma] = (kanji, keyword)


    port = 9001

    context = zmq.Context()
    socket = context.socket(zmq.REP)
    socket.bind(f"tcp://*:{port}")

    while True:
        message = json.loads(socket.recv_string())
        print(f"Received request: __{message}__")

        retval = keyword_frequency(message["kanji"], message["keyword"])
        socket.send_string(retval)

