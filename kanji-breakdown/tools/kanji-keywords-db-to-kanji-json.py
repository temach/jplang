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


KANJI_DB_PATH = "../resources/kanji-keywords.db-2021-08-14_00-00-01"
DB = sqlite3.connect(KANJI_DB_PATH)

c = DB.cursor()
c.execute("SELECT * FROM kanjikeywords")
data = c.fetchall()


work_elements = {}

for e in data:
    kanji = e[0]
    keyword = e[1]
    note = e[2]
    
    uni = kanji.encode("unicode_escape")
    ucode = "{:0>5}".format(uni[2:].decode())

    svg_path = "../resources/kanji-svg-minimised/{}.svg".format(ucode)
    if not os.path.exists(svg_path):
        raise Exception("No such path: {} for kanji {}".format(svg_path, kanji))

    with open(svg_path, "r") as svg_file:
        svg = svg_file.read()

    work_elements[keyword] = {
        "keyword": keyword,
        "kanji": kanji,
        "unicode": ucode.lstrip("0"),
        "note": note,
        "svg": svg,
    }


elements = json.dumps(work_elements, indent=2, ensure_ascii=False)

with open("../resources/kanji.json", "wb") as f:
    f.write(elements.encode("utf-8"))

