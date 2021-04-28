#!/usr/bin/env python

import os
import re
import sqlite3
import json
from bottle import route, get, run, template

CMUDICT = None

@get('/search/<en>')
def candidate(en):
    """ Look up words that start with "^en" prefix in cmudict dictonary"""
    result_list = []
    for line in CMUDICT:
        m = re.match(en, line)
        if m:
            result_list.append(line)
    return json.dumps(result_list)


@get('/')
def index():
    connection = sqlite3.connect(SQLITE_FILE)
    c = connection.cursor()

    c.execute('''SELECT * FROM onyomi;''')
    rows = c.fetchall()
    string_rows = (str(r) for r in rows)
    single_string = "</br>".join(string_rows)

    return f"<html><body><p>{single_string}</p></body></html>"


def init_database(sqlite_connection, onyomi_path):
    """ Initialise database by creating table and populating it"""

    c = connection.cursor()
    c.execute("""
        CREATE TABLE onyomi
        (
            [english] text PRIMARY KEY,
            [katakana] text NOT NULL,
            [hiragana] text NOT NULL,
            [keyword] text NOT NULL
        );
    """)

    with open(onyomi_path, "r", encoding="utf-8") as f:
        sql = """INSERT INTO onyomi VALUES(?,?,?,?);"""

        for line in f.readlines():
            english, katakana, hiragana, keyword, freq = line.split("=")
            data = (english.strip(), katakana.strip(), hiragana.strip(), keyword.strip())
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
