#!/usr/bin/env python

import os
import re
import sqlite3
import json
from bottle import route, get, run, template, request, post

CMUDICT = None

@get("/api/search/<en>")
def candidate(en):
    """ Look up words that start with "^en" prefix in cmudict dictonary"""
    result_list = []
    for line in CMUDICT:
        m = re.match(en, line)
        if m:
            result_list.append(line)
    return json.dumps(result_list)



@post("/api/submit")
def submit():
    # https://bottlepy.org/docs/dev/api.html#bottle.BaseRequest.query_string
    cursor = connection.cursor()
    payload = request.json
    print(payload)
    print(cursor)
    try:
        cursor.execute("""UPDATE OR ABORT onyomi SET (english, keyword) = (?, ?) WHERE english=?""",
            (payload["onyomi"], payload["keyword"], payload["onyomi"]))
        connection.commit()
    except Exception as e:
        return HTTPResponse(status=500, body="{}".format(e))
    return HTTPResponse(status=200)


@get("/api/work")
def work_elements():
    connection = sqlite3.connect(SQLITE_FILE)
    c = connection.cursor()

    c.execute('''SELECT * FROM onyomi;''')
    rows = c.fetchall()

    enriched = []
    for r in rows:
        item = {
            "onyomi": r[0],
            "keyword": r[1],
            "metadata": {
                "katakana": r[2],
                "hiragana": r[3],
                "notes": r[4],
            }
        }
        enriched.append(item)

    return json.dumps(enriched)


def init_database(sqlite_connection, onyomi_path):
    """ Initialise database by creating table and populating it"""

    c = connection.cursor()
    c.execute("""
        CREATE TABLE onyomi
        (
            [english] text PRIMARY KEY,
            [keyword] text NOT NULL,
            [katakana] text NOT NULL,
            [hiragana] text NOT NULL,
            [notes] text
        );
    """)

    with open(onyomi_path, "r", encoding="utf-8") as f:
        sql = """INSERT INTO onyomi VALUES(?,?,?,?,NULL);"""

        for line in f.readlines():
            english, katakana, hiragana, keyword, freq = line.split("=")
            data = (english.strip(), keyword.strip(), katakana.strip(), hiragana.strip())
            c.execute(sql, data)

        sqlite_connection.commit()


if __name__=="__main__":
    SQLITE_FILE = "../onyomi-database.sqlite"
    ONYOMI_FILE = "../onyomi-keywords.txt"

    skip_init = os.path.isfile(SQLITE_FILE)

    connection = sqlite3.connect(SQLITE_FILE)

    with open("../resources/cmudict.dict", "r", encoding="utf-8") as sne:
        CMUDICT = sne.readlines()

    if not skip_init:
        init_database(connection, ONYOMI_FILE)

    run(host='localhost', port=8080)
