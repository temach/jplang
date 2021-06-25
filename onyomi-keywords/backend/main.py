#!/usr/bin/env python

import os
import re
import sqlite3
import json
import urllib.request

from bottle import route, get, run, template, request, post, HTTPResponse, static_file


FREQ_NOT_FOUND_MARKER = 999999
RESULTS_LIMIT = 10000
ANKI_DECK_NAME = "OnyomiKeywords"
ANKI_MODEL_NAME = "OnyomiKeywordsModel"
ANKI_MODEL_CSS = """
.card {
 font-family: arial;
 font-size: 20px;
 text-align: center;
 color: black;
 background-color: white;
}

k {
 color: #aa0000;
}
"""
ANKI_MODEL_FRONT = """
{{Front}}
"""
ANKI_MODEL_BACK = """
{{FrontSide}}

<hr id=answer>

{{Back}}
"""


# Static Routes
@get("/")
def root():
    return static_file("index.html", root="../frontend/build/")


@get("/static/<filepath:path>")
def static(filepath):
    return static_file(filepath, root="../frontend/build/static")


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


def return_search_results(data):
    # only return top N words
    return json.dumps(data[:RESULTS_LIMIT])


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

    c.execute('''SELECT * FROM onyomi ORDER BY english;''')
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


def anki_request(action, **params):
    return {'action': action, 'params': params, 'version': 6}


def invoke(action, **params):
    requestJson = json.dumps(anki_request(action, **params)).encode('utf-8')
    from pprint import pprint
    pprint(requestJson)
    response = json.load(urllib.request.urlopen(
        urllib.request.Request('http://localhost:8765', requestJson)))
    if len(response) != 2:
        raise Exception(
            'response to {} has an unexpected number of fields'.format(action))
    if 'error' not in response:
        raise Exception(
            'response to {} is missing required error field'.format(action))
    if 'result' not in response:
        raise Exception(
            'response to {} is missing required result field'.format(action))
    if response['error'] is not None:
        raise Exception('response to {} returned error: {}'.format(
            action, response['error']))
    return response['result']


def make_front(keyword):
    # make front of note
    front = []
    marked = False

    for c in keyword:
        if c.isupper() and not marked:
            # start of mark
            marked = True
            front.append("<k>")
            front.append(c)

        elif (not c.isupper()) and marked:
            # end of mark
            front.append("</k>")
            front.append(c)
            marked = False

        else:
            front.append(c)

    return "".join(front)


@post("/api/anki_upsync_one")
def anki_upsync_one():
    # https://bottlepy.org/docs/dev/api.html#bottle.BaseRequest.query_string
    cursor = connection.cursor()
    payload = request.json

    english = payload["onyomi"]
    keyword = payload["keyword"]
    katakana = payload["metadata"]["katakana"]
    hiragana = payload["metadata"]["hiragana"]
    notes = payload["metadata"]["notes"]

    try:
        cursor.execute(
            """UPDATE OR ABORT onyomi SET (english, keyword, notes) = (?, ?, ?) WHERE english=? """,
            (english, keyword, notes, english)
        )
        connection.commit()

        # check connection and permission
        invoke('requestPermission')

        # check that special deck exists, if not create it
        if not ANKI_DECK_NAME in invoke('deckNames'):
            result = invoke('createDeck', deck=ANKI_DECK_NAME)

        if not ANKI_MODEL_NAME in invoke('modelNames'):
            model = {
                "modelName": ANKI_MODEL_NAME,
                "inOrderFields": ["{{Front}}", "{{Back}}"],
                "css": ANKI_MODEL_CSS,
                "isCloze": False,
                "cardTemplates": [
                    {
                        "Name": "Card 1",
                        "Front": ANKI_MODEL_FRONT,
                        "Back": ANKI_MODEL_BACK
                    }
                ]
            }
            result = invoke('createModel', **model)

        # check if note is already present by looking for
        # onyomi pattern "xxx =" in the back of notes
        query = 'deck:{} back:"{} =*"'.format(ANKI_DECK_NAME, english)
        result = invoke('findNotes', query=query)

        if result:
            if len(result) != 1:
                raise Exception(
                    """expected at most one note id for anki onyomi search '{}' but instead got {}""".format(query, result))

            # found note, update it
            front = make_front(keyword)
            back = "{} = {} = {} = {} = {}".format(
                english, keyword, katakana, hiragana, notes)

            # second make note
            note = {
                "id": result[0],
                "fields": {
                    "Front": front,
                    "Back": back,
                },
            }
            result = invoke('updateNoteFields', note=note)

        else:
            # nothing found, create it

            # first make front and back of card
            front = make_front(keyword)
            back = "{} = {} = {} = {} = {}".format(
                english, keyword, katakana, hiragana, notes)

            # second make note
            note = {
                "deckName": ANKI_DECK_NAME,
                "modelName": ANKI_MODEL_NAME,
                "fields": {
                    "Front": front,
                    "Back": back,
                },
                "options": {
                    "allowDuplicate": False,
                    "duplicateScope": "deck",
                },
                "tags": [
                    "onyomi_keywords_app"
                ],
            }
            result = invoke('addNote', note=note)
    except Exception as e:
        return HTTPResponse(status=500, body="{}".format(e))

    # if last result was ok, then everything was ok
    if result:
        return HTTPResponse(status=200)


@get("/api/anki_downsync_all")
def anki_downsync_all():
    # check connection and permission
    invoke('requestPermission')

    if not ANKI_DECK_NAME in invoke('deckNames'):
        # nothing to pull
        return HTTPResponse(status=200)

    if not ANKI_MODEL_NAME in invoke('modelNames'):
        # nothing to pull
        return HTTPResponse(status=200)

    # find all note ids from our anki deck
    query = 'deck:{}'.format(ANKI_DECK_NAME)
    result = invoke('findNotes', query=query)

    # get detailed info
    info = []
    for n in result:
        r = invoke('notesInfo', notes=[n])
        info.extend(r)

    try:
        # clear database
        c = connection.cursor()
        c.execute("DROP TABLE onyomi;")

        # create new table
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

        sql = """INSERT INTO onyomi VALUES(?,?,?,?,?);"""

        # fill table with data
        for note in info:
            data = note["fields"]["Back"]["value"].split("=")

            if len(data) == 4:
                english, keyword, katakana, hiragana = data
                notes = ""
            else:
                english, keyword, katakana, hiragana, notes = data

            data = (english.strip(), keyword.strip(),
                    katakana.strip(), hiragana.strip(), notes.strip())
            c.execute(sql, data)

        connection.commit()

    except Exception as e:
        print(data)
        print(e)
        return HTTPResponse(status=500, body="{}".format(e))

    return HTTPResponse(status=200)


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
