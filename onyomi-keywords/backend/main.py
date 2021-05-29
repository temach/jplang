#!/usr/bin/env python

import os
import re
import sqlite3
import json
from bottle import route, get, run, template, request, post


CMUDICT = None


def search(needle, haystack):
    result_list = []
    for line in haystack:
        m = re.match(needle, line)
        if m:
            result_list.append(line)
    return result_list


def str_to_len(s):
    word, separator, transcription = s.partition(" ")
    word = word.removesuffix("(2)")
    return len(word)

@get("/api/search/<en>")
def candidate(en):
    """ Look up words that start with "^en" prefix in cmudict dictonary"""
    eng_vowels = ["a", "e", "i", "u", "y", "o"]
    if en[-1] in eng_vowels:
        if len(en) >= 2 and en[-2] == en[-1]:
            en_without_last = en[:-1]
            result = search(en_without_last, CMUDICT)
            result = sorted(result, key=str_to_len, reverse=True)
            return json.dumps(result)
        result = search(en, CMUDICT)
        result = sorted(result, key=str_to_len)
        return json.dumps(result)
    result = search(en, CMUDICT)
    return json.dumps(result)


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
        CMUDICT = [line for line in CMUDICT if "'s" not in line]

    if not skip_init:
        init_database(connection, ONYOMI_FILE)

    run(host='localhost', port=8080)
