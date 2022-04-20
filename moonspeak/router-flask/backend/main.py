#!/usr/bin/env python3
import os
import json
import sqlite3
import re
from urllib.parse import urlparse, quote_plus, unquote_plus

from flask import Flask
from flask import request

import requests

VERSION = "0.1"
DB_PATH = "../tmp/hud_features.db"
DB = sqlite3.connect(DB_PATH)
MAPPING = {}


app = Flask(__name__, static_folder="../frontend/", static_url_path="/")

MY_HOSTNAME = None

@app.route("/api/routing/", methods=["GET", "HEAD", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"])
def routing(fid, furl):
    # import pdb; pdb.set_trace()
    print(request.url)

    print(f"api/routing/{fid}/")
    read_url = unquote_plus(fid)
    print(f"Decoded this feature url __{read_url}__")
    feature_root_url = MAPPING[fid]
    url = feature_root_url + furl

    print(f"Requesting {url}")

    # delete host field to force re-evaluation when proxying the request
    headers = request.headers.mutablecopy()
    del headers["host"]

    # r = requests.request(request.method, url, headers=headers, data=await request.body())

    # print(f'requested with headers: {r.request.headers}')
    # if not furl:
    #     # modify returned content if we were requesting root doc, delete content-lenght so it will get recalculated
    #     new_content = modify_root_doc(r.text, fid)
    #     del r.headers["content-length"]
    #     return Response(content=new_content, status_code=r.status_code, headers=r.headers)
    return 200


@app.get("/")
def index():
    # this is a hack to enforce <base> tag with a single origin
    # right now there is no code to support different <base> tags per request (i.e. per different HOST header)
    # so fail loudly if we notice that someone whants our functionallity under a different hostname  
    global MY_HOSTNAME
    user_header = request.headers.get('host').split(":")[0]
    if not MY_HOSTNAME:
        MY_HOSTNAME = user_header
        print("Setting MY_HOSTNAME header: __{}__".format(MY_HOSTNAME))
    else:
        assert user_header == MY_HOSTNAME, "This resource is known under two different names: {} and {}".format(MY_HOSTNAME, user_header)

    return app.send_static_file("index.html")

def modify_root_doc(doc_text, fid):
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(doc_text, 'html.parser')
    base_tag = soup.new_tag("base", href="http://{}/api/routing/{}/".format(MY_HOSTNAME, fid))
    soup.head.insert(0, base_tag)
    print(f"Soup for fid __{fid}__:")
    print(str(soup))
    return str(soup)

@app.get("/api/getfeature")
def feature():
    feature_url = request.args.get('feature_url')
    # fid = re.sub(r'[\\/*?:"<>|+=.& ]', "_", feature_url)
    fid = quote_plus(feature_url)
    print(f"fid: __{fid}__")
    # add mapping with unified url representation
    MAPPING[fid] = urlparse(feature_url).geturl()

    src = "http://{}/api/routing/{}/".format(MY_HOSTNAME, fid)
    print(f"src: __{src}__")
    # return root URL for this feature
    return { 
        "src" : src,
        "text" : "use src",
    }


def db_init():
    c = DB.cursor()
    c.execute("""CREATE TABLE hud_features (
            id TEXT NOT NULL UNIQUE
            , url TEXT NOT NULL UNIQUE
            , notes TEXT
            , PRIMARY KEY (id, url)
        );
        """)
    DB.commit()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Run as "python main.py"')
    parser.add_argument('port', type=int, help='port number')
    args = parser.parse_args()

    db_needs_init = (not os.path.isfile(DB_PATH)) or (
        os.path.getsize(DB_PATH) == 0)

    if db_needs_init:
        db_init()

    if not db_needs_init:
        # if db already existed, read some data from it
        c = DB.cursor()
        c.execute("SELECT * FROM hud_features")
        rows = c.fetchall()
        for r in rows:
            name, url, notes = r
            print(r)

    print("Running server on port {}".format(args.port))
    import logging
    app.run(host="0.0.0.0", port=args.port, debug=True)
