#!/usr/bin/env python3
from datetime import datetime
from pprint import pprint
from collections import defaultdict
import os
from bottle import request, post, get, route, run, template, HTTPResponse, static_file
import json
import sqlite3
import pdb
import re
import nltk
from nltk.stem.porter import PorterStemmer
from nltk.stem import WordNetLemmatizer


@get("/")
def index():
    return static_file("index.html", root="../frontend/")


@get("/version")
def version():
    data = {"version": "0.1"}
    return json.dumps(data)


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


def get_en_freq(word):
    return (
        CORPUS.get(word, -1),
        SUBS.get(word, -1)
    )


@get("/api/synonyms/<word>")
def synonyms(word):
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
    popularity = defaultdict(int)

    for thesaurus in [MOBY, OPENOFFICE, WORDNET]:
        for w in thesaurus.get(word, []):
            # check that word is not obscure
            freq = get_en_freq(w)
            if (freq[0] < 0 and freq[1] < 0):
                continue
            # build the item
            item = {
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

    return json.dumps(ordered)


@ get("/api/suggestions/<kanji>")
def suggestions(kanji):
    result = []

    u = SCRIPTIN[kanji]["uniq"]
    item = {
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

    return json.dumps(result)


# def check_word_conflict_re(needle, haystack):
#     result = {}
#     stem = STEMMER.stem(needle)
#
#     r = re.compile("^{}$".format(word), re.IGNORECASE)
#     for icorpus, e in enumerate(CORPUS.keys()):
#         if r.match(e):
#             break
#
#     if stem in haystack:
#         result["stem"] = haystack[stem]
#
#     stem_conflict = haystack.get(stem, "")
#
#     lemma = LEMMATIZER.lemmatize(needle)
#     lemma_conflict = haystack.get(lemma, "")


@ get("/api/keywordcheck/<kanji>/<keyword>")
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
    # the stem for child is child, so it gets inserted, but stem for
    # children is children, but lemma for children is child, so lemma is found
    # but stem is not
    if stem_kanji and lemma_kanji:
        assert stem_kanji == lemma_kanji

    if stem_keywords_conflict and stem_kanji != kanji:
        conflict += "{} is key for {}. ".format(
            stem_keywords_conflict, stem_kanji)

    if lemma_keywords_conflict and lemma_kanji != kanji and stem != lemma:
        conflict += "{} is key for {}. ".format(
            lemma_keywords_conflict, lemma_kanji)

    response = {
        "word": "",
        "freq": get_en_freq_regex(keyword),
        "metadata": conflict,
    }
    return json.dumps(response)


@ get("/api/work")
def work():
    c = DB.cursor()
    c.execute("SELECT * FROM kanjikeywords;")
    rows = c.fetchall()
    data = {k: (k, "", "") for k in WORK}
    for r in rows:
        kanji = r[0]

        keyword = r[1]
        new_stem = STEMMER.stem(keyword)
        new_lemma = LEMMATIZER.lemmatize(keyword)
        KEYWORDS[new_stem] = (kanji, keyword)
        KEYWORDS[new_lemma] = (kanji, keyword)

        data[kanji] = r

    payload = [e for e in data.values()]
    return json.dumps(payload, ensure_ascii=False)


@ post("/api/submit")
def submit():
    payload = request.json

    try:
        c = DB.cursor()
        # https://www.sqlite.org/lang_replace.html
        # https://www.sqlite.org/lang_UPSERT.html
        c.execute("""INSERT OR ABORT INTO kanjikeywords VALUES (?, ?, ?)
                ON CONFLICT(kanji) DO UPDATE SET keyword=excluded.keyword, notes=excluded.notes;
                """,
                  (payload["kanji"], payload["keyword"], payload["notes"]))
        DB.commit()
    except Exception as e:
        # return 2xx response because too lazy to unwrap errors in Elm
        return HTTPResponse(status=202, body="{}".format(e))

    # update in memory keyword dictionary
    # step 1: drop old stem/lemma keyword that matches this kanji
    global KEYWORDS
    kanji = payload["kanji"]
    keyword = payload["keyword"]
    KEYWORDS = {k: v for k, v in KEYWORDS.items() if v[0] != kanji}
    KEYWORDS[STEMMER.stem(keyword)] = (kanji, keyword)
    KEYWORDS[LEMMATIZER.lemmatize(keyword)] = (kanji, keyword)

    # return a fake body because too lazy to unwrap properly in Elm
    return HTTPResponse(status=200, body="")


def db_init():
    c = DB.cursor()
    c.execute("""CREATE TABLE kanjikeywords (
            kanji TEXT NOT NULL UNIQUE
            , keyword TEXT NOT NULL UNIQUE
            , notes TEXT
            , PRIMARY KEY (kanji)
        );
        """)
    DB.commit()


if __name__ == "__main__":
    KANJI_DB_PATH = "../kanji-keywords.db"
    db_needs_init = not os.path.isfile(KANJI_DB_PATH)
    DB = sqlite3.connect(KANJI_DB_PATH)

    if db_needs_init:
        db_init()

    # english frequency
    CORPUS = {}
    SUBS = {}
    # thesaurus
    WORDNET = {}
    MOBY = {}
    OPENOFFICE = {}
    # other
    KEYWORDS = {}
    ONYOMI = {}
    WORK = []
    KANJIDIC = {}
    SCRIPTIN = {}

    STEMMER = PorterStemmer()
    LEMMATIZER = WordNetLemmatizer()

    with open("../resources/english-from-gogle-corpus-by-freq.txt") as f:
        for number, line in enumerate(f, start=1):
            word = line.split()[0].strip()
            CORPUS[word] = number

    with open("../resources/english-from-subtitles-by-freq.txt") as f:
        for number, line in enumerate(f, start=1):
            word = line.split()[0].strip()
            SUBS[word] = number

    with open("../resources/english-onyomi-keywords.txt") as onyomi:
        for line in onyomi:
            _, _, _, keywords, _ = line.split("=")
            key = keywords.split("/")[0].lower().strip().split()[0]
            stem = STEMMER.stem(key)
            lemma = LEMMATIZER.lemmatize(key)
            ONYOMI[stem] = key
            ONYOMI[lemma] = key

    with open("../resources/kanji-by-freq.json") as kanji:
        WORK = list(json.load(kanji).keys())

    with open("../resources/keywords-kanjidic2-meanings.json") as kanjidic:
        KANJIDIC = json.load(kanjidic)

    with open("../resources/keywords-scriptin-kanji-keys.json") as scriptin:
        SCRIPTIN = json.load(scriptin)

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

    pprint(list(ONYOMI.items())[:25])
    pprint(list(CORPUS.items())[:25])
    pprint(list(SUBS.items())[:25])
    pprint(WORK[:25])
    pprint(list(KANJIDIC.items())[:25])
    pprint(list(SCRIPTIN.items())[:25])
    pprint(list(MOBY.items())[:25])
    pprint(list(OPENOFFICE.items())[:25])
    pprint(list(WORDNET.items())[:25])

    port = 9000
    print("Running bottle server on port {}".format(port))
    run(host="localhost", port=port, debug=True)
