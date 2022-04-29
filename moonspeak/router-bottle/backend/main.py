#!/usr/bin/env python3
import os
import json
import sqlite3
import re
from urllib.parse import unquote_plus

from bottle import route, run, get, static_file, request, HTTPResponse
import requests

VERSION = "0.1"
DB_PATH = "../tmp/hud_features.db"
DB = sqlite3.connect(DB_PATH)
MY_HOSTNAME = None


def modify_root_doc(doc_text, fid):
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(doc_text, 'html.parser')
    base_tag = soup.new_tag("base", href="http://{}/api/routing/{}/".format(MY_HOSTNAME, fid))
    try:
        soup.head.insert(0, base_tag)
    except AttributeError as e:
        print("Starting debugger becasue of exception: {}".format(e))
        import pdb; pdb.set_trace()
    return str(soup)


def retrieve_url(url, req):
    print(f"Requesting {url}")

    # in bottle request.headers is read-only so we create a new object to pass to requests
    # Host must be deleted so network transport can infer the correct Host header from url
    # Content-Length must be deleted because bottle always includes it (in case of POST its set to '')
    bad_headers = frozenset(('Host', 'Content-Length'))
    headers = {k: v for k,v in req.headers.items() if k not in bad_headers}

    r = requests.request(req.method, url, headers=headers, data=req.body)

    # remove hop-by-hop headers
    # see: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Connection
    # see: https://datatracker.ietf.org/doc/html/rfc2616.html#section-13.5.1
    # list of hop-by-hop headers: https://github.com/python/cpython/blob/main/Lib/wsgiref/util.py#L151
    del r.headers["connection"]

    return r


@route("/api/routing/<fid>", method=["GET"])
def routing_root(fid):
    r = retrieve_url(unquote_plus(fid), request)

    # modify returned content because we are requesting root doc
    new_content = modify_root_doc(r.content, fid)
    # delete content-lenght so it will get recalculated
    del r.headers["content-length"]

    return HTTPResponse(body=new_content, status=r.status_code, headers=r.headers.items())


@route("/api/routing/<fid>/<furl:re:.*>", method=["GET", "HEAD", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"])
def routing(fid, furl):
    url = unquote_plus(fid) + "/" + furl
    r = retrieve_url(url, request)
    return HTTPResponse(body=r.content, status=r.status_code, headers=r.headers.items())


@get("/")
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

    return static_file("index.html", root="../frontend/")


@get("/static/<filepath:re:.*\.(css|js)>")
def static(filepath):
    return static_file(filepath, root="../frontend/static/")

@get("/plugins/<filepath:re:.*\.(css|js)>")
def static(filepath):
    return static_file(filepath, root="../frontend/plugins/")

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
    run(host="0.0.0.0", port=args.port, debug=True)
