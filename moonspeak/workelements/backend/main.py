#!/usr/bin/env python3
import os
import json
import sqlite3
from pprint import pprint

from bottle import response, request, post, get, route, run, template, HTTPResponse, static_file  # type: ignore


VERSION = "0.1"
KANJI_DB_PATH = "../tmp/kanji-parts.db"
DB = sqlite3.connect(KANJI_DB_PATH)
WORK = {}

@get("/")
def index():
    return static("index.html")

@route("/static/<path:path>")
def static(path):
    return static_file(os.path.join("static", path), root="../frontend/")

@get("/api/work")
def work():
    c = DB.cursor()
    c.execute("SELECT * FROM kanjikeywords;")
    rows = c.fetchall()
    data = {e["kanji"]: (e["kanji"], e["keyword"], e["note"]) for e in WORK}
    for r in rows:
        kanji = r[0]
        data[kanji] = r

    payload = [e for e in data.values()]
    return json.dumps(payload, ensure_ascii=False)


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
    import argparse

    parser = argparse.ArgumentParser(description='Feature, run as "python main.py"')
    parser.add_argument('port', type=int, help='port number')
    args = parser.parse_args()

    db_needs_init = (not os.path.isfile(KANJI_DB_PATH)) or (
        os.path.getsize(KANJI_DB_PATH) == 0)

    if db_needs_init:
        db_init()

    with open("../resources/kanji.json") as kanji:
        WORK = json.load(kanji)["work_elements"]

    pprint(WORK[:10])

    print("Running bottle server on port {}".format(args.port))
    run(host="0.0.0.0", port=args.port, debug=True)
