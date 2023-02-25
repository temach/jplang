#!/usr/bin/env python3
import os
import json
import sqlite3
import re
from urllib.parse import urlparse
from pathlib import Path
import datetime

from flask import Flask, send_from_directory, make_response, request, redirect  # type: ignore
from nltk.stem.porter import PorterStemmer  # type: ignore
from nltk.stem import WordNetLemmatizer  # type: ignore

class AccessLogMiddleware:
    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        def wrapped(status, headers, *args):
            self.log_access(environ, status, headers)
            return start_response(status, headers, *args)
        return self.app(environ, wrapped)

    def log_access(self, environ, status_code, headers):
        method = environ['REQUEST_METHOD']
        # repeat wsgi_decode_dance from werkzeug here
        # see: https://github.com/pallets/werkzeug/blob/main/src/werkzeug/_internal.py#L149
        path = environ['PATH_INFO'].encode('latin1').decode()
        query = ''
        if environ['QUERY_STRING']:
            query = '?' + environ['QUERY_STRING']
        status = status_code
        log_message = f'{environ["REMOTE_ADDR"]} - [{self.get_time()}] "{method} {path}{query} HTTP/1.1" {status}'
        logger.info(log_message)

    def get_time(self):
        return datetime.datetime.utcnow().strftime('%d/%b/%Y:%H:%M:%S')


class KeywordInfo():
    def __init__(self, keyword, description, kanji=None):
        self.keyword = keyword
        self.description = description
        self.kanji = kanji


import logging
LOGLEVEL = os.environ.get("LOGLEVEL", "DEBUG").upper()
logging.basicConfig(level=LOGLEVEL)
logger = logging.getLogger(__name__)

DEVMODE = os.environ.get("MOONSPEAK_DEVMODE", "1")

MOONSPEAK_THREADS = 1
DB_PATH = "../userdata/kanji-parts.db"
DB = sqlite3.connect(DB_PATH, check_same_thread=(MOONSPEAK_THREADS != 1))

app = Flask(__name__, static_folder=None)

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
def root():

    def choose_lang(request):
        # find the language and redirect to that, otherwise relative paths break
        # language check order:
        # 0 - what language cookie you have
        cookie_lang = request.cookies.get("lang")
        if cookie_lang:
            return cookie_lang

        # 1 - what does accept_language header have
        accept_language_header = request.headers.get("Accept-Language")
        if accept_language_header:
            m = re.match('[a-z]{2,3}', accept_language_header.strip(), flags=re.IGNORECASE)
            if m:
                return m.group()

        # 2 - what domain are you targetting, useful for tools that normally dont supply accept_language header
        hostname = urlparse(request.headers.get("Host")).hostname
        if hostname:
            m = re.match('.*[.]([a-z0-9]+)$', hostname, flags=re.IGNORECASE)
            if m:
                return m.group()

        # finally use english by default
        return "en"

    lang = choose_lang(request)

    # in dev mode, language dirs may be absent, then redirect to /localhost/
    langdir = Path(f"../frontend/dist/{lang}")
    if not langdir.exists():
        return redirect("/localhost/", code=307)

    return redirect(f"/{lang}/", code=307)


@app.get("/<lang>/")
@app.get("/<lang>/<path:filepath>")
def static(lang, filepath="index.html"):
    root = Path("../frontend/dist/") / lang
    if lang == "localhost":
        # this is for dev mode only
        root = Path("../frontend/src/")
    return send_from_directory(root, filepath)


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


def run_server(args):
    if DEVMODE:
        # this server definitely works on all platforms
        if args.uds:
            raise Exception("Uds socket not supported when MOONSPEAK_DEVMODE is active")
        app.run(host=args.host, port=args.port, debug=True)
    else:
        # this server definitely works on linux and is used in prod
        if args.uds:
            try:
                # handle the case when previous cleanup did not finish properly
                os.unlink(args.uds)
            except FileNotFoundError:
                # if there was nothing to unlink, thats good
                pass
            except Exception:
                logger.warn(f"Error trying to unlink existing unix socket {args.uds} before re-binding.", exc_info=True)
        bind_addr = args.uds if args.uds else f"{args.host}:{args.port}"
        import pyruvate
        try:
            # only use 1 thread, otherwise must add locks for sqlite and globals. Pyruvate uses threading model (see its source).
            # about GIL: https://opensource.com/article/17/4/grok-gil
            # threading vs asyncio (both are a pain): https://www.endpointdev.com/blog/2020/10/python-concurrency-asyncio-threading-users/
            # WSGI processes and threads: https://modwsgi.readthedocs.io/en/develop/user-guides/processes-and-threading.html
            # thread locals: https://github.com/python/cpython/blob/main/Lib/_threading_local.py
            assert MOONSPEAK_THREADS == 1, "Use only one thread or you must add locks. pyruvate uses threading model."
            pyruvate.serve(AccessLogMiddleware(app), bind_addr, MOONSPEAK_THREADS)
        finally:
            # when the server is shutting down
            logger.warn("Shutting down server.")
            if args.uds:
                logger.info(f"Removing unix socket {args.uds}");
                os.unlink(args.uds)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Run as "python main.py"')
    parser.add_argument('--host', type=str, default=os.getenv("MOONSPEAK_HOST", "0.0.0.0"), help='hostname or ip, does not combine with unix sock')
    parser.add_argument('--port', type=int, default=os.getenv("MOONSPEAK_PORT", "8040"), help='port number')
    parser.add_argument('--uds', type=str, default=os.getenv("MOONSPEAK_UDS", ""), help='Path to bind unix domain socket e.g. "./service.sock", does not combine with TCP socket')
    args = parser.parse_args()

    db_needs_init = (not os.path.isfile(DB_PATH)) or (
        os.path.getsize(DB_PATH) == 0)

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

    run_server(args)
