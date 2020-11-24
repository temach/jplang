#!/usr/bin/env python3
from datetime import datetime
from pprint import pprint
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


def get_en_freq(word):
    r = re.compile("^{}$".format(word), re.IGNORECASE)
    for icorpus, e in enumerate(CORPUS):
        if r.match(e):
            break

    for isubs, e in enumerate(SUBS):
        if r.match(e):
            break

    if icorpus == len(CORPUS)-1:
        icorpus = -1

    if isubs == len(SUBS)-1:
        isubs = -1

    return (icorpus, isubs)
    # try:
    #     return (CORPUS.index(word), SUBS.index(word))
    # except ValueError:
    #     return (-1, -1)


@get("/api/suggestions/<kanji>")
def suggestions(kanji):
    result = []

    u = SCRIPTIN[kanji]["uniq"]
    item = {"word": u,
            "freq": get_en_freq(u),
            "origin": "scriptin-uniq"
            }
    result.append(item)

    for k in SCRIPTIN[kanji]["keys"]:
        item = {"word": k,
                "freq": get_en_freq(k),
                "origin": "scriptin-keys"
                }
        result.append(item)

    for m in KANJIDIC[kanji]:
        item = {"word": m,
                "freq": get_en_freq(m),
                "origin": "kanjidic"
                }
        result.append(item)

    pprint(result)

    return json.dumps(result)


@ get("/api/frequency/<keyword>")
def keyword_frequency(keyword):
    # return HTTPResponse(status=200, body=json.dumps(freq))
    return json.dumps(get_en_freq(keyword))


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
    # tmppayload = [("a", "first", ""),
    #               ("b", "second", "asd"),
    #               ("c", "third", "")
    #               ]

    return json.dumps(payload, ensure_ascii=False)
    # return json.dumps(tmppayload, ensure_ascii=False)


@ post("/api/submit")
def submit():
    payload = request.json
    pprint(payload)

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
        # return 2xx responce because too lazy to unwrap errors in Elm
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

    CORPUS = []
    SUBS = []
    ONYOMI = []
    WORK = []
    KANJIDIC = []
    SCRIPTIN = []
    with open("../resources/english-from-gogle-corpus-by-freq.txt") as google:
        for line in google:
            CORPUS.append(line.split()[0].strip())

    with open("../resources/english-from-subtitles-by-freq.txt") as subs:
        for line in subs:
            SUBS.append(line.split()[0].strip())

    with open("../resources/english-onyomi-keywords.txt") as onyomi:
        for line in onyomi:
            _, _, _, keywords, _ = line.split("=")
            key = keywords.split("/")[0].lower().strip()
            ONYOMI.append(key)

    with open("../resources/kanji-by-freq.json") as kanji:
        WORK = list(json.load(kanji).keys())

    with open("../resources/keywords-kanjidic2-meanings.json") as kanjidic:
        KANJIDIC = json.load(kanjidic)

    with open("../resources/keywords-scriptin-kanji-keys.json") as scriptin:
        SCRIPTIN = json.load(scriptin)

    pprint(ONYOMI[:50])
    pprint(CORPUS[:50])
    pprint(SUBS[:50])
    pprint(WORK[:50])
    pprint(list(KANJIDIC.items())[:50])
    pprint(list(SCRIPTIN.items())[:50])

    port = 9000
    print("Running bottle server on port {}".format(port))
    run(host="localhost", port=port, debug=True)
