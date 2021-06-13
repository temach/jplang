#!/usr/bin/env python

import os
import re
import sqlite3
import json
from bottle import route, get, run, template, request, post, HTTPResponse


FREQ_NOT_FOUND_MARKER = 999999
RESULTS_LIMIT = 1200


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
                "phonetics": CMUDICT[w],
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
    return json.dumps(data[:RESULTS_LIMIT])


@get("/api/search/<en>")
def candidate_smart(en):
    """ Look up words that start with "^en" prefix in cmudict dictonary"""
    en = en.lower()

    eng_vowels = ["i", "u"]

    bad_ending_sounds = [
        "AA", "AE", "AH", "AO", "AW", "AY",
        "CH",
        "EH", "ER", "EY",
        "G",
        "IH", "IY",
        "JH",
        "K",
        "N",
        "NG",
        "T",
        "UH", "UW",
        "Y",
    ]

    if len(en) >= 2 and en[-1] in eng_vowels and en[-2] == en[-1]:
        # find the longest word possible for words with double vowel at the end
        # e.g. KUU or FUU
        en_without_last = en[:-1]
        result = search(en_without_last, CMUDICT.keys())
        result = sorted(result, key=str_to_len, reverse=True)
        return return_search_results(shape_word_search_results(result))

    if len(en) >= 2 and en[-1] in eng_vowels:
        # find the shortest word possible for words with vowel at the end
        # e.g. KU or FU
        result = search(en, CMUDICT.keys())
        result = sorted(result, key=str_to_len)
        return return_search_results(shape_word_search_results(result))

    if len(en) == 1:
        result = search(en, CMUDICT.keys())

        filtered = []
        for w in result:
            if len(w) <= 2:
                continue

            transcription = CMUDICT[w].split()
            if len(transcription) <= 1:
                continue

            if transcription[1] in bad_ending_sounds:
                continue

            filtered.append(w)

        shaped_alphabetical = shape_word_search_results(filtered)
        # shaped_sorted = sorted(shaped_alphabetical, key=search_res_to_freq)
        return return_search_results(shaped_alphabetical)

    # just return results in alphabetical order
    result = search(en, CMUDICT.keys())
    shaped_alphabetical = shape_word_search_results(result)
    # shaped_sorted = sorted(shaped_alphabetical, key=search_res_to_freq)
    return return_search_results(shaped_alphabetical)


@get("/api/search/regex/<regex>")
def candidate_regex(regex):
    if any(c.islower() for c in regex):
        # this is word regex
        haystack = CMUDICT.keys()
    else:
        # this is phonetics regex
        haystack = CMUDICT.values()

    needle = re.compile(regex)
    keys_of_matched_staws = []
    # find needle in haystack by examining each straw
    for straw_key, straw in zip(CMUDICT.keys(), haystack):
        m = needle.match(straw)
        if m:
            # this straw matches, remember the key of this straw
            keys_of_matched_staws.append(straw_key)

    # using the straw keys create array of rich and informative return values
    alphabetical = shape_word_search_results(keys_of_matched_staws)
    return return_search_results(alphabetical)


def is_letters_match_transcription(letters, transcription):
    zipped = zip(letters, transcription)
    for letter, phoneme in zipped:
        if letter not in phoneme:
            return False
    return True


@get("/api/search/phonetics/<phonetics>")
def candidate_phonetics(phonetics):
    # to search for "M A.?.? T"
    # give this function "M A T"
    # see also: http://www.speech.cs.cmu.edu/tools/lextool.html
    phonetics = phonetics.upper().split()
    result_list = []
    for word, transcription in CMUDICT.items():
        if is_letters_match_transcription(phonetics, transcription.split()):
            # all letters were in transcription
            result_list.append(word)

    shaped_alphabetical = shape_word_search_results(result_list)
    return return_search_results(shaped_alphabetical)


@get("/api/search/verbatim/<en>")
def candidate_verbatim(en):
    """ Look up words that start with "^en" prefix in cmudict dictonary"""
    en = en.lower()
    result = search(en, CMUDICT.keys())
    shaped_alphabetical = shape_word_search_results(result)
    # shaped_sorted = sorted(shaped_alphabetical, key=search_res_to_freq)
    return return_search_results(shaped_alphabetical)


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

    english = payload["onyomi"]
    keyword = payload["keyword"]
    notes = payload["metadata"]["notes"]

    try:
        cursor.execute(
            """UPDATE OR ABORT onyomi SET (english, keyword, notes) = (?, ?, ?) WHERE english=? """,
            (english, keyword, notes, english)
        )
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
            [notes] text NOT NULL
        );
    """)

    with open(onyomi_path, "r", encoding="utf-8") as f:
        sql = """INSERT INTO onyomi VALUES(?,?,?,?,"");"""

        for line in f.readlines():
            english, katakana, hiragana, keyword, freq = line.split("=")
            data = (english.strip(), keyword.strip(),
                    katakana.strip(), hiragana.strip())
            c.execute(sql, data)

        sqlite_connection.commit()


if __name__ == "__main__":
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
