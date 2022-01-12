#!/usr/bin/env python3
from datetime import datetime
from pprint import pprint
from collections import defaultdict
import os
from bottle import request, post, get, route, run, template, HTTPResponse, static_file  # type: ignore
import json
import sqlite3
import pdb
import re
from nltk.stem.porter import PorterStemmer  # type: ignore
from nltk.stem import WordNetLemmatizer  # type: ignore
from typing import TypedDict, Any
from typeguard import typechecked
import re
from itertools import dropwhile
from bottle import response
from django.shortcuts import render

from django.http import HttpResponse

from django.template import loader

# Create your views here.

def shlupa(request):
    return render(request, '')

def index(request):
    #return HttpResponse('Helo World!')
    template = loader.get_template('breakdown/index.html')
    return HttpResponse(template.render({}, request))



class KeyCandidate(TypedDict):
    word: str
    metadata: str
    freq: list[int]


#@get("/")
#def index():
 #   return static("index.html")

@route("/static/<path:path>")
def static(path):
    return static_file(os.path.join("static", path), root="../frontend/")

@get("/version")
def version():
    data = {"version": "0.1"}
    return json.dumps(data)


@get("/api/parts")
def work():
    radicals = {}
    for data in RADICALS.values():
        svg = data["svg"]
        svg = svg.replace("<svg ", '<svg class="svgpart" ')
        radicals[data["keyword"]] = (data["kanji"], data["keyword"], data["note"], svg, [])

    payload = [e for e in radicals.values()]
    response.content_type = "application/json"
    return json.dumps(payload[:50], ensure_ascii=False)


@get("/api/work")
def work():
    c = DB.cursor()
    c.execute("SELECT * FROM parts;")
    data_current = c.fetchall()

    data_template = {data["keyword"]: (data["kanji"], data["keyword"], data["note"], data["svg"], []) for data in WORK.values()}

    for e in data_current:
        kanjikey = e[0]
        partkey = e[1]
        data_template[kanjikey][-1].append(partkey)

    payload = [e for e in data_template.values()]
    response.content_type = "application/json"
    return json.dumps(payload[:100], ensure_ascii=False)

@post("/api/partscheck")
def keywordcheck():
    payload = request.json

    similar_kanji = {}

    for new_part in payload["parts"]:
        kanjikeys = PARTS.get(new_part)
        if kanjikeys:
            for key in kanjikeys:
                kanji_data = WORK[key]
                similar_kanji[key] = kanji_data

    payload = [e for e in similar_kanji.values()]
    response.content_type = "application/json"
    return json.dumps(payload[:100], ensure_ascii=False)


@post("/api/submit")
def submit():
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

    pprint(list(WORK.items())[:10])
    pprint(list(RADICALS.items())[:10])

    port = 9000
    print("Running bottle server on port {}".format(port))
    run(host="0.0.0.0", port=port, debug=True)
