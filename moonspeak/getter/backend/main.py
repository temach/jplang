#!/usr/bin/env python3
import os
import json
import sqlite3
import re
from pprint import pprint
import uuid
from urllib.parse import urlparse, urlunparse

from bottle import response, request, post, get, route, run, template, HTTPResponse, static_file, error  # type: ignore
import requests

VERSION = "0.1"
DB_PATH = "../tmp/features.db"
DB = sqlite3.connect(DB_PATH)
MAPPING = {}


@route('/api/routing/<fid>/<furl:re:.+>', methods=['GET', 'PUT', 'POST'])
def routing(fid, furl):
    print(MAPPING)
    print(f'Request {furl} of feature {fid}')
    feature_root_url = MAPPING[fid]
    url = feature_root_url + furl
    r = requests.get(url)
    print(f'Requested {r.url}')
    return r.text


@get("/")
def index():
    return static("index.html")


@route("/static/<path:path>")
def static(path):
    if "index.html" in path:
        return static_file("index.html", root="../frontend/")
    return static_file(os.path.join("static", path), root="../frontend/")


@get("/api/getfeature")
def feature():
    url = request.query.feature_url

    r = requests.get(url, headers={'accept':'application/json'})

    from bs4 import BeautifulSoup
    soup = BeautifulSoup(r.text, 'html.parser')

    fid = str(uuid.uuid4())
    base_tag = soup.new_tag("base", href="api/routing/{}/".format(fid))
    soup.head.insert(0, base_tag)

    # unify url representation
    MAPPING[fid] = urlparse(url).geturl()

    resp = {
        "text": str(soup),
    }
    return json.dumps(resp)


def db_init():
    c = DB.cursor()
    c.execute("""CREATE TABLE features (
            id TEXT NOT NULL UNIQUE
            , url TEXT NOT NULL UNIQUE
            , notes TEXT
            , PRIMARY KEY (id, url)
        );
        """)
    DB.commit()


if __name__ == "__main__":
    db_needs_init = (not os.path.isfile(DB_PATH)) or (
        os.path.getsize(DB_PATH) == 0)

    if db_needs_init:
        db_init()

    if not db_needs_init:
        # if db already existed, read some data from it
        c = DB.cursor()
        c.execute("SELECT * FROM features")
        rows = c.fetchall()
        for r in rows:
            name, url, notes = r
            print(r)

    port = 9000
    print("Running bottle server on port {}".format(port))
    run(host="0.0.0.0", port=port, debug=True)
