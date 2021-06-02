#!/usr/bin/env python

import os
import re
import sqlite3
import json
from bottle import route, get, run, template, request, post


FREQ_NOT_FOUND_MARKER=999999


def get_en_freq(word):
    return [
        CORPUS.get(word, FREQ_NOT_FOUND_MARKER),
        SUBS.get(word, FREQ_NOT_FOUND_MARKER)
    ]


def search(needle, haystack):
    regex = re.compile(needle)
    result_list = []
    for line in haystack:
        m = regex.match(line)
        if m:
            result_list.append(line)
    return result_list


def shape_word_search_results(words):
    ret = []
    for w in words:
        icorpus, isubs = get_en_freq(w)
        ret.append({
            "keyword": w,
            "metadata": {
                "corpus": icorpus,
                "subs": isubs,
                "phonetics" : CMUDICT[w],
            },
        })
    return ret



def str_to_len(word):
    word = word.removesuffix("(2)")
    return len(word)


def search_res_to_freq(res):
    return res["metadata"]["corpus"] + res["metadata"]["subs"]


def return_search_results(data):
    # only return top N words
    return json.dumps(data[:400])


@get("/api/search/<en>")
def candidate(en):
    """ Look up words that start with "^en" prefix in cmudict dictonary"""
    en = en.lower()
    eng_vowels = ["a", "e", "i", "u", "y", "o"]

    if en[-1] in eng_vowels:

        if len(en) >= 2 and en[-2] == en[-1]:
            en_without_last = en[:-1]
            result = search(en_without_last, CMUDICT.keys())
            result = sorted(result, key=str_to_len, reverse=True)
            return return_search_results( shape_word_search_results(result) )

        result = search(en, CMUDICT.keys())
        result = sorted(result, key=str_to_len)
        return return_search_results( shape_word_search_results(result) )

    result = search(en, CMUDICT.keys())
    shaped_unsorted = shape_word_search_results(result) 
    shaped_sorted = sorted(shaped_unsorted, key=search_res_to_freq, reverse=True)
    return return_search_results(shaped_sorted)


@get("/api/search/phonetic/<phonetics>")
def candidate(phonetics):
    """ Look up words that start with "^en" prefix in cmudict dictonary"""
    en = en.lower()
    return []
# 
#     regex = re.compile(phonetics)
#     result_list = []
#     for line in CMUDICT.values():
#         m = regex.match(line)
#         if m:
#             result_list.append(line)
#     return result_list
# 
# 
# def shape_word_search_results(words):
#     ret = []
#     for w in words:
#         icorpus, isubs = get_en_freq(w)
#         ret.append({
#             "keyword": w,
#             "metadata": {
#                 "corpus": icorpus,
#                 "subs": isubs,
#                 "phonetics" : CMUDICT[w],
#             },
#         })
#     return ret
# 
#     result = search(en, CMUDICT.values())
#     shaped_unsorted = shape_word_search_results(result) 
#     shaped_sorted = sorted(shaped_unsorted, key=search_res_to_freq, reverse=True)
#     return return_search_results(shaped_sorted)
# 

@get("/api/search/verbatim/<en>")
def candidate(en):
    """ Look up words that start with "^en" prefix in cmudict dictonary"""
    en = en.lower()
    result = search(en, CMUDICT.keys())
    shaped_unsorted = shape_word_search_results(result) 
    shaped_sorted = sorted(shaped_unsorted, key=search_res_to_freq, reverse=True)
    return return_search_results(shaped_sorted)


@get("/api/check_keyword/<keyword>")
def check_keyword(keyword):
    icorpus, isubs = get_en_freq(keyword.lower())
    ret = {
        "freq": {
            "corpus": icorpus,
            "subs": isubs,
        }
    }
    return ret


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

    # mapping {word : transcription}
    CMUDICT = {}
    with open("../resources/cmudict.dict", "r", encoding="utf-8") as sne:
        for line in sne.readlines():
            if "'s" in line:
                continue
            word, separator, transcription = line.partition(" ")
            CMUDICT[word.strip()] = transcription.strip()

    # english frequency
    CORPUS = {}
    SUBS = {}

    with open("../resources/english-from-gogle-corpus-by-freq.txt") as f:
        for number, line in enumerate(f, start=1):
            word = line.split()[0].strip()
            CORPUS[word] = number

    with open("../resources/english-from-subtitles-by-freq.txt") as f:
        for number, line in enumerate(f, start=1):
            word = line.split()[0].strip()
            SUBS[word] = number

    if not skip_init:
        init_database(connection, ONYOMI_FILE)

    run(host='localhost', port=8080)
