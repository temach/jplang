#!/usr/bin/env python3
from datetime import datetime
from pprint import pprint
from collections import defaultdict
import os
from bottle import request, post, get, route, run, template, HTTPResponse, static_file
import json
import sqlite3
import os.path
import pdb
import re


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


@ get("/api/keywordcheck/<keyword>")
def keyword_frequency(keyword):
    response = {
        "word": "",
        "freq": get_en_freq_regex(keyword),
        "metadata": "",
    }
    return json.dumps(response)


@ get("/api/work")
def work():
    c = DB.cursor()
    c.execute("SELECT * FROM kanjikeywords ORDER BY kanji;")
    rows = c.fetchall()
    data = {k: (k, "", "") for k in WORK}
    for r in rows:
        kanji = r[0]
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
    ONYOMI = {}
    WORK = []
    KANJIDIC = {}
    SCRIPTIN = {}
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
            key = keywords.split("/")[0].lower().strip()
            # this can be a Set, but using a dictionary with only keys is fine too
            ONYOMI[key] = True

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
