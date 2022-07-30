#!/usr/bin/env python3
import os
import json
import sqlite3
import re
import urllib

import gunicorn.app.base
import gunicorn.config

import werkzeug
from flask import Flask, send_from_directory, make_response, request, redirect  # type: ignore
from nltk.stem.porter import PorterStemmer  # type: ignore
from nltk.stem import WordNetLemmatizer  # type: ignore


class KeywordInfo():
    def __init__(self, keyword, description, kanji=None):
        self.keyword = keyword
        self.description = description
        self.kanji = kanji


class GunicornApp(gunicorn.app.base.Application):

    def __init__(self, app, options=None):
        self.options = options or {}
        self.application = app
        super().__init__()

    def init(self, parser, opts, args):
        return None

    def load(self):
        return self.application

    # Override the default load_config function from gunicorn because it
    # tries to do parse_args and that is breaking our parse_args
    # instead we use parse_known_args here
    def load_config(self):
        # parse console args
        parser = self.cfg.parser()
        args, argv = parser.parse_known_args()
        if argv:
            print('unrecognized arguments: {}'.format(argv))

        # optional settings from apps
        cfg = self.init(parser, args, args.args)

        # set up import paths and follow symlinks
        self.chdir()

        # Load up the any app specific configuration
        if cfg:
            for k, v in cfg.items():
                self.cfg.set(k.lower(), v)

        env_args = parser.parse_args(self.cfg.get_cmd_args_from_env())

        if args.config:
            self.load_config_from_file(args.config)
        elif env_args.config:
            self.load_config_from_file(env_args.config)
        else:
            default_config = gunicorn.config.get_default_config_file()
            if default_config is not None:
                self.load_config_from_file(default_config)

        # Load up environment configuration
        for k, v in vars(env_args).items():
            if v is None:
                continue
            if k == "args":
                continue
            self.cfg.set(k.lower(), v)

        # Lastly, update the configuration with any command line settings.
        for k, v in vars(args).items():
            if v is None:
                continue
            if k == "args":
                continue
            self.cfg.set(k.lower(), v)

        # current directory might be changed by the config now
        # set up import paths and follow symlinks
        self.chdir()


app = Flask(__name__)

VERSION = "0.1"
KANJI_DB_PATH = "../tmp/kanji-parts.db"
DB = sqlite3.connect(KANJI_DB_PATH)

# kanji in-memory list
WORK = {}

# english frequency
CORPUS = {}
SUBS = {}

# other
KEYWORDS: dict[str, KeywordInfo] = {}
STEMMER = PorterStemmer()
LEMMATIZER = WordNetLemmatizer()


@app.route("/<lang>/api/work")
def work(lang):
    c = DB.cursor()
    c.execute("SELECT * FROM kanjikeywords;")
    rows = c.fetchall()
    data = {e["kanji"]: (e["kanji"], e["keyword"], e["note"]) for e in WORK}
    for r in rows:
        kanji = r[0]
        data[kanji] = r

    payload_data = {"work": [e for e in data.values()]}
    payload_str = json.dumps(payload_data, ensure_ascii=False)

    response = make_response(payload_str, 200, {"Content-Type": "application/json"})
    return response


def get_en_freq_regex(word):
    r = re.compile("^{}$".format(word), re.IGNORECASE)
    for icorpus, e in enumerate(CORPUS.keys()):
        if r.match(e):
            break

    for isubs, e in enumerate(SUBS.keys()):
        if r.match(e):
            break

    if icorpus == len(CORPUS.keys())-1:
        icorpus = -1

    if isubs == len(SUBS.keys())-1:
        isubs = -1

    return (icorpus, isubs)


@app.route("/<lang>/api/keywordcheck/<kanji>/<keyword>")
def keyword_check(lang, kanji, keyword):
    """
    Test conflict search with a database like this
    Note that stem for 'children' is 'child' and overrides the 'child' keyword:

    kanji   keyword     notes
    Z       child       My notes
    Y       children    text
    A       chilly      note2
    B       chills      note3

    """
    keyword = keyword.lower()
    stem = STEMMER.stem(keyword)
    lemma = LEMMATIZER.lemmatize(keyword)
    conflict = ""

    # check for conflict with keywords (kanji and onyomi)
    # better checking than just a UNIQUE constraints in database
    stem_conflicting = KEYWORDS.get(stem, None)
    lemma_conflicting = KEYWORDS.get(lemma, None)
    verbatim_conflicting = KEYWORDS.get(keyword, None)

    # assert that kanji is the same (it is a bad match whem lemma vs stem assign to different kanji)
    # e.g. there is an edge case: when building keywords from database
    # the stem for "child" is "child", so it gets inserted, and then:
    # the stem for "children" is "children", but lemma for "children" is "child", so lemma is found but stem is not
    if stem_conflicting and stem_conflicting.kanji and lemma_conflicting and lemma_conflicting.kanji:
        assert stem_conflicting.kanji == lemma_conflicting.kanji

    if verbatim_conflicting and verbatim_conflicting.kanji != kanji:
        conflict += stem_conflicting.description + ";\n"

    if stem_conflicting and stem_conflicting.kanji != kanji and stem_conflicting.description not in conflict:
        conflict += stem_conflicting.description + ";\n"

    if lemma_conflicting and lemma_conflicting.kanji != kanji and lemma_conflicting.description not in conflict:
        conflict += lemma_conflicting.description + ";\n"

    # check for conflict as substring, e.g. "fullfill" and "full" are too similar
    for substr_info in KEYWORDS.values():
        if len(keyword) <= 2 and len(substr_info.keyword) >= 7:
            # no need to report long words when user only typed in few letters
            # but do not overdo this, because e.g. "gel" must still report "gelatine"
            continue

        if substr_info.keyword.startswith(keyword) and substr_info.kanji != kanji and substr_info.description not in conflict:
                conflict += substr_info.description + ";\n"

    payload_str = json.dumps({
        "word": "",
        "freq": get_en_freq_regex(keyword),
        "metadata": conflict,
    }, ensure_ascii=False)

    response = make_response(payload_str, 200, {"Content-Type": "application/json"})
    return response


@app.post("/<lang>/api/submit")
def submit(lang):
    payload = request.json

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
        # return 2xx response because too lazy to unwrap errors in Elm
        body_str = json.dumps({
            "exception": str(e),
            "payload": payload,
        }, ensure_ascii=False)

        response = make_response(body_str, 202, {"Content-Type": "application/json"})
        return response

    # update in-memory keyword dictionary
    global KEYWORDS
    kanji = payload["kanji"]
    keyword = payload["keyword"]
    # step 1: drop old stem/lemma keyword that matches this kanji
    KEYWORDS = {k: v for k, v in KEYWORDS.items() if v.kanji != kanji}
    # step 2: assign new kanji-keyword mapping
    ki = KeywordInfo(keyword, f"{keyword} is key for {kanji} kanji", kanji=kanji)
    KEYWORDS[STEMMER.stem(keyword)] = ki
    KEYWORDS[LEMMATIZER.lemmatize(keyword)] = ki

    # return an empty body because too lazy to unwrap properly in Elm
    response = make_response("", 200, {"Content-Type": "text/plain"})
    return response


@app.get("/")
def get_index():
    # must redirect to language sub-url otherwise relative links break
    host_url = urllib.parse.urlparse(request.host_url)
    domain = host_url.hostname.split(".")[-1]
    return redirect(f"/{domain}/", code=307)


@app.get("/<path:filename>")
def get_static(filename):
    # when requesting index.html, must specify the folder with a trailing slash
    if filename.endswith("/"):
        return send_from_directory("../frontend/", filename + "index.html")
    else:
        return send_from_directory("../frontend/", filename)


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


def count_uppercase(word):
    count = 0
    for char in word:
        if char.isupper():
            count += 1
    return count


if __name__ == "__main__":
    db_needs_init = (not os.path.isfile(KANJI_DB_PATH)) or (
        os.path.getsize(KANJI_DB_PATH) == 0)

    if db_needs_init:
        db_init()

    with open("../resources/kanji.json") as kanji:
        WORK = json.load(kanji)["work_elements"]

    if not db_needs_init:
        # if db already existed, read some data from it
        c = DB.cursor()
        c.execute("SELECT * FROM kanjikeywords;")
        rows = c.fetchall()
        for r in rows:
            kanji, keyword, _ = r
            ki = KeywordInfo(keyword, f"{keyword} is key for {kanji} kanji", kanji=kanji)
            KEYWORDS[STEMMER.stem(keyword)] = ki
            KEYWORDS[LEMMATIZER.lemmatize(keyword)] = ki

    with open("../resources/english-onyomi-keywords.txt") as onyomi:
        for line in onyomi:
            _, _, hiragana, romaji, keywords = line.split("=")
            # sometimes might have more than one section, when not finally decided
            first_keywords_section = keywords.split("/")[0].strip()
            # take all words with two or more capital letters, transform into lowercase and strip
            keys = [w.lower().strip() for w in first_keywords_section.split() if count_uppercase(w) >= 2]
            # try to make lemma and stem for each key
            for key in keys:
                ki = KeywordInfo(key, f"{first_keywords_section} is key for {hiragana} ({romaji}) onyomi")
                KEYWORDS[key] = ki
                KEYWORDS[STEMMER.stem(key)] = ki
                KEYWORDS[LEMMATIZER.lemmatize(key)] = ki

    with open("../resources/english-from-gogle-corpus-by-freq.txt") as f:
        for number, line in enumerate(f, start=1):
            word = line.split()[0].strip()
            CORPUS[word] = number

    with open("../resources/english-from-subtitles-by-freq.txt") as f:
        for number, line in enumerate(f, start=1):
            word = line.split()[0].strip()
            SUBS[word] = number

    GunicornApp(app).run()
