#!/usr/bin/env python3
import os
import json
import sqlite3
import pdb
import re
from typing import TypedDict, Any
from typeguard import typechecked
from collections import defaultdict

import zmq


def get_parts():
    radicals = {}
    for data in RADICALS.values():
        svg = data["svg"]
        svg = svg.replace("<svg ", '<svg class="svgpart" ')
        radicals[data["keyword"]] = (data["kanji"], data["keyword"], data["note"], svg, False, [])

    payload = [e for e in radicals.values()]
    return payload


def check_parts(keywords):
    similar_kanji = {}

    for new_part in keywords:
        kanjikeys = PARTS.get(new_part)
        if kanjikeys:
            for key in kanjikeys:
                kanji_data = WORK[key]
                similar_kanji[key] = kanji_data

    payload = [e for e in similar_kanji.values()]
    return payload


def submit(parts):
    # payload = request.json

    # try:
    #     c = DB.cursor()
    #     # https://www.sqlite.org/lang_replace.html
    #     # https://www.sqlite.org/lang_UPSERT.html
    #     c.execute("""INSERT OR ABORT INTO kanjikeywords VALUES (?, ?, ?)
    #             ON CONFLICT(kanji) DO UPDATE SET keyword=excluded.keyword, note=excluded.note;
    #             """,
    #               (payload["kanji"], payload["keyword"], payload["note"]))
    #     DB.commit()
    # except Exception as e:
    #     # return 2xx response because too lazy to unwrap errors in Elm
    #     return HTTPResponse(status=202, body="{}".format(e))

    # # return a fake body because too lazy to unwrap properly in Elm
    # return HTTPResponse(status=200, body="")
    pass



def db_init():
    c = DB.cursor()
    c.execute("""CREATE TABLE parts (
            kanjikeyword TEXT NOT NULL
            , partkeyword TEXT NOT NULL
            , PRIMARY KEY (kanjikeyword, partkeyword)
        );
        """)

    DB.commit()


if __name__ == "__main__":
    KANJI_DB_PATH = "../kanji-parts.db"
    db_needs_init = (not os.path.isfile(KANJI_DB_PATH)) or (
        os.path.getsize(KANJI_DB_PATH) == 0)
    DB = sqlite3.connect(KANJI_DB_PATH)

    if db_needs_init:
        db_init()

    WORK = {}
    RADICALS = {}
    PARTS = defaultdict(list)

    with open("../resources/kanji.json") as kanji:
        WORK = json.load(kanji)

    with open("../resources/radicals.json") as radicals:
        RADICALS = json.load(radicals)

    c = DB.cursor()
    c.execute("SELECT * FROM parts;")
    for pair in c:
        kanjikey, partkey = pair
        PARTS[partkey].append(kanjikey)

    port = 9002

    context = zmq.Context()
    socket = context.socket(zmq.REP)
    socket.bind(f"tcp://*:{port}")

    while True:
        message = json.loads(socket.recv_string())

        if message["function"] == "get_parts":
            payload = get_parts()
            s = json.dumps(payload[:50], ensure_ascii=False)
            socket.send_string(s)

        elif message["function"] == "check_parts":
            payload = check_parts[message["parts"]]
            s = json.dumps(payload[:50], ensure_ascii=False)
            socket.send_string(s)

        elif message["function"] == "submit":
            payload = submit[message["parts"]]
            s = json.dumps(payload[:50], ensure_ascii=False)
            socket.send_string(s)

        else:
            payload = json.dumps({
                "status": False,
                "metadata": "Could not parse request",
            })
            socket.send_string(payload)



