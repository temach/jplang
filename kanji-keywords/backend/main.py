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


class KeyCandidate(TypedDict):
    word: str
    metadata: str
    freq: list[int]


ListKeyCandidate = list[KeyCandidate]
Thesaurus = dict[str, list[str]]

INDEX_NOT_FOUND_MARKER = 99999


@get("/")
def index():
    return static_file("index.html", root="../frontend/")


@get("/version")
def version():
    data = {"version": "0.1"}
    return json.dumps(data)


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


def get_en_freq(word):
    return [
        CORPUS.get(word, -1),
        SUBS.get(word, -1)
    ]


@get("/api/synonyms/<word>")
def synonyms(word):
    res = inner_synonyms(word)
    return json.dumps(res)


def inner_synonyms(word) -> ListKeyCandidate:
    # usefull thesaurus sources: https://github.com/Ron89/thesaurus_query.vim

    # Big Huge Thesaurus:
    # https://github.com/tttthomasssss/PyHugeThesaurusConnector
    # Key:
    # 56d5758eb85511ea73b9ab65436761c2
    # e.g: https://words.bighugelabs.com/api/2/56d5758eb85511ea73b9ab65436761c2/word/json

    # Maryam webster keys:
    # https://github.com/PederHA/mwthesaurus
    # Key (Thesaurus):
    # fb5b269d-867b-4401-85a0-777436d9c033
    # Key (Intermediate Thesaurus):
    # 72e1d7bf-09a3-43ef-9dae-17989dc6d355

    # return json.dumps([{"word": "artem", "metadata": "artem", "freq": (10, 10)}])

    word = word.lower()
    result = {}
    popularity: dict[str, int] = defaultdict(int)

    for thesaurus in [MOBY, OPENOFFICE, WORDNET]:
        for w in thesaurus.get(word, []):
            # check that word is not obscure, it should be present in both google and subs corpus
            freq = get_en_freq(w)
            if (freq[0] < 0 and freq[1] < 0):
                continue
            # build the item
            item: KeyCandidate = {
                "word": w,
                "freq": freq,
                "metadata": ""
            }
            # save the item
            result[w] = item
            # everytime the word appears in a different thesaurus, increase its popularity
            popularity[w] += 1

    for w in result.keys():
        result[w]["metadata"] = str(popularity[w])

    # sort according to popularity
    ordered = sorted(
        result.values(),
        key=lambda item: int(item["metadata"]),
        reverse=True
    )

    return ordered


@get("/api/suggestions/<kanji>")
def suggestions(kanji):
    res = inner_suggestions(kanji)
    return json.dumps(res)


@typechecked
def inner_suggestions(kanji) -> ListKeyCandidate:
    result = []

    u = SCRIPTIN[kanji]["uniq"]
    item: KeyCandidate = {
        "word": u,
        "freq": get_en_freq(u),
        "metadata": "scriptin-uniq"
    }
    result.append(item)

    for k in SCRIPTIN[kanji]["keys"]:
        item = {
            "word": k,
            "freq": get_en_freq(k),
            "metadata": "scriptin-keys"
        }
        result.append(item)

    for m in KANJIDIC[kanji]:
        item = {
            "word": m,
            "freq": get_en_freq(m),
            "metadata": "kanjidic"
        }
        result.append(item)

    # regex test value: "understand/divide or minute / equal /etc./plural"
    # should be: ['understand', 'divide', 'minute ', 'equal ', 'etc', 'plural']
    kanjidamage_keywords = re.split(r"[,./]| or ", KANJIDAMAGE[kanji])
    for d in (m.strip() for m in kanjidamage_keywords if len(m) > 0):
        item = {
            "word": d,
            "freq": get_en_freq(d),
            "metadata": "kanjidamage"
        }
        result.append(item)

    return result


@get("/api/expressions/<kanji>")
def expressions(kanji):
    res = inner_expressions(kanji)
    return json.dumps(res)


@typechecked
def inner_expressions(kanji) -> ListKeyCandidate:
    expressions = set()

    max_samples = 7
    samples = 0

    for expr in ROUTLEDGE.keys():
        if kanji in expr:
            expressions.add(expr)
            samples += 1
            if samples > max_samples:
                samples = 0
                break

    for expr in LEEDS:
        if kanji in expr:
            expressions.add(expr)
            samples += 1
            if samples > max_samples:
                samples = 0
                break

    for expr in WIKTIONARY:
        if kanji in expr:
            expressions.add(expr)
            samples += 1
            if samples > max_samples:
                samples = 0
                break

    for expr in CHRISKEMPSON:
        if kanji in expr:
            expressions.add(expr)
            samples += 1
            if samples > max_samples:
                samples = 0
                break

    payload: ListKeyCandidate = []

    for expr in expressions:
        freq = []
        for source in (list(ROUTLEDGE.keys()), LEEDS, WIKTIONARY, CHRISKEMPSON):
            try:
                index = source.index(expr)
            except ValueError:
                index = INDEX_NOT_FOUND_MARKER
            freq.append(index)

        if freq.count(INDEX_NOT_FOUND_MARKER) >= 3:
            # ignore words that are present in only one dictionary
            # becasue they are obscure words
            continue

        meaning = ""
        if expr in ROUTLEDGE:
            meaning += ROUTLEDGE[expr]["meaning"]
        if expr in EDICT:
            meaning += "/{}".format(EDICT[expr])
        payload.append({
            "word": expr,
            "freq": freq,
            "metadata": meaning,
        })

    return payload


@ get("/api/keywordcheck/<kanji>/<keyword>")
def keyword_frequency(kanji, keyword):
    stem = STEMMER.stem(keyword)
    lemma = LEMMATIZER.lemmatize(keyword)
    conflict = ""

    # check for conflict with onyomi
    stem_onyomi_conflict = ONYOMI.get(stem, None)
    lemma_onyomi_conflict = ONYOMI.get(lemma, None)

    if stem_onyomi_conflict:
        conflict += "{} is an onyomi key. ".format(
            stem_onyomi_conflict)

    if lemma_onyomi_conflict and stem != lemma:
        conflict += "{} is an onyomi key. ".format(
            lemma_onyomi_conflict)

    # check for conflict with keywords
    # better checking than just a UNIQUE constraints in database
    stem_kanji, stem_keywords_conflict = KEYWORDS.get(stem, (None, None))
    lemma_kanji, lemma_keywords_conflict = KEYWORDS.get(lemma, (None, None))

    # assert that kanji is the same
    # there is an edge case: when building keywords from database
    # the stem for "child" is "child", so it gets inserted, but stem for
    # "children" is "children", but lemma for "children" is "child", so lemma is found
    # but stem is not
    if stem_kanji and lemma_kanji:
        assert stem_kanji == lemma_kanji

    if stem_keywords_conflict and stem_kanji != kanji:
        conflict += "{} is key for {}. ".format(
            stem_keywords_conflict, stem_kanji)

    if lemma_keywords_conflict and lemma_kanji != kanji and stem != lemma:
        conflict += "{} is key for {}. ".format(
            lemma_keywords_conflict, lemma_kanji)

    response = {
        "word": "",
        "freq": get_en_freq_regex(keyword),
        "metadata": conflict,
    }
    return json.dumps(response)


@ get("/api/work")
def work():
    c = DB.cursor()
    c.execute("SELECT * FROM kanjikeywords;")
    rows = c.fetchall()
    data = {k: (k, "", "") for k in WORK.keys()}
    for r in rows:
        kanji = r[0]

        keyword = r[1]
        new_stem = STEMMER.stem(keyword)
        new_lemma = LEMMATIZER.lemmatize(keyword)
        KEYWORDS[new_stem] = (kanji, keyword)
        KEYWORDS[new_lemma] = (kanji, keyword)

        data[kanji] = r

    payload = [e for e in data.values()]
    return json.dumps(payload, ensure_ascii=False)


@ post("/api/submit")
def submit():
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
        return HTTPResponse(status=202, body="{}".format(e))

    # update in-memory keyword dictionary
    global KEYWORDS
    kanji = payload["kanji"]
    keyword = payload["keyword"]
    # step 1: drop old stem/lemma keyword that matches this kanji
    KEYWORDS = {k: v for k, v in KEYWORDS.items() if v[0] != kanji}
    # step 2: assign new kanji-keyword pair
    KEYWORDS[STEMMER.stem(keyword)] = (kanji, keyword)
    KEYWORDS[LEMMATIZER.lemmatize(keyword)] = (kanji, keyword)

    # return a fake body because too lazy to unwrap properly in Elm
    return HTTPResponse(status=200, body="")


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


def expression_filter(expression: str, ALLOWED_CHARS: dict) -> bool:
    for ch in expression:
        if not ch in ALLOWED_CHARS:
            return False
    return True


if __name__ == "__main__":
    KANJI_DB_PATH = "../kanji-keywords.db"
    db_needs_init = (not os.path.isfile(KANJI_DB_PATH)) or (
        os.path.getsize(KANJI_DB_PATH) == 0)
    DB = sqlite3.connect(KANJI_DB_PATH)

    if db_needs_init:
        db_init()

    # english frequency
    CORPUS = {}
    SUBS = {}
    # thesaurus
    WORDNET: Thesaurus = {}
    MOBY: Thesaurus = {}
    OPENOFFICE: Thesaurus = {}
    # other
    KEYWORDS: dict[str, tuple[str, str]] = {}
    ONYOMI = {}
    WORK = {}
    # kanji keyword suggestions
    KANJIDIC = {}
    SCRIPTIN = {}
    KANJIDAMAGE = {}

    # jp expressions
    LEEDS: list[str] = []
    ROUTLEDGE: dict[str, Any] = {}
    CHRISKEMPSON: list[str] = []
    WIKTIONARY: list[str] = []

    # jp expression translations
    EDICT = {}

    STEMMER = PorterStemmer()
    LEMMATIZER = WordNetLemmatizer()

    with open("../resources/english-from-gogle-corpus-by-freq.txt") as f:
        for number, line in enumerate(f, start=1):
            word = line.split()[0].strip()
            CORPUS[word] = number

    with open("../resources/english-from-subtitles-by-freq.txt") as f:
        for number, line in enumerate(f, start=1):
            word = line.split()[0].strip()
            SUBS[word] = number

    with open("../resources/english-onyomi-keywords.txt") as onyomi:
        for line in onyomi:
            _, _, _, keywords, _ = line.split("=")
            key = keywords.split("/")[0].lower().strip().split()[0]
            stem = STEMMER.stem(key)
            lemma = LEMMATIZER.lemmatize(key)
            ONYOMI[stem] = key
            ONYOMI[lemma] = key

    with open("../resources/kanji-by-freq.json") as kanji:
        WORK = json.load(kanji)

    with open("../resources/keywords-kanjidic2-meanings.json") as kanjidic:
        KANJIDIC = json.load(kanjidic)

    with open("../resources/keywords-scriptin-kanji-keys.json") as scriptin:
        SCRIPTIN = json.load(scriptin)

    with open("../resources/keywords-kanjidamage-anki-cards.json") as kanjidamage:
        KANJIDAMAGE = json.load(kanjidamage)

    with open("../resources/english-thesaurus-moby-mthesaur.txt") as f:
        for line in f:
            line = line.lower()
            key = line.split(',')[0]
            synonyms = line.split(',')[1:]
            MOBY[key] = synonyms

    with open("../resources/english-thesaurus-openoffice.txt") as f:
        lines = f.readlines()
        i = 1
        while i < len(lines):
            line = lines[i].lower()
            key, n_meanings = line.split('|')
            meanings = set()
            for k in range(int(n_meanings)):
                l = lines[i + k].lower()
                meaning_line = l.split('|')[1:]
                meanings.update(meaning_line)
            OPENOFFICE[key] = list(meanings)
            i += 1 + int(n_meanings)

    with open("../resources/english-thesaurus-wordnet.jsonl") as f:
        for line in f:
            data = json.loads(line)
            key = data["word"].lower()
            synonyms = data["synonyms"]
            if key in WORDNET:
                WORDNET[key].extend(synonyms)
            else:
                WORDNET[key] = synonyms

    with open("../resources/japanese-wordfreq-leeds-uni.json") as f:
        freq_list = json.load(f)
        # some japanese expressions use unusual kanji or is plain kana
        # its not interesting, so drop it
        LEEDS = [v for v in freq_list]

    with open("../resources/japanese-wordfreq-routledge.json") as f:
        data = json.load(f)
        for elem in data:
            for entry in elem["kanjis"]:
                entry = re.sub("\[", "", entry)
                entry = re.sub(";.*\]", "", entry)
                ROUTLEDGE[entry] = elem

    with open("../resources/japanese-wordfreq-wiktionary.json") as f:
        WIKTIONARY = json.load(f)

    with open("../resources/japanese-wordfreq-chriskempson-subs.json") as f:
        CHRISKEMPSON = json.load(f)

    with open("../resources/japanese-wordfreq-edict-sub.txt") as f:
        work_kanji_set = set(WORK.keys())
        for line in f:
            entry, separator, meaning = line.partition("/")
            # entry is just the plain kanji word
            first_word = entry.partition(" ")[0].strip()
            if set(first_word).isdisjoint(work_kanji_set):
                # no elements in common with work_kanji_set, therefore skip this entry
                continue
            EDICT[first_word] = meaning

    # pprint(list(SUBS.items())[:25])
    # pprint(list(CORPUS.items())[:25])
    pprint(list(EDICT.items())[:50])

    port = 9000
    print("Running bottle server on port {}".format(port))
    run(host="0.0.0.0", port=port, debug=True)
