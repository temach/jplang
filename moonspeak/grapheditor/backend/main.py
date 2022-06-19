#!/usr/bin/env python3
import os
import json
import sqlite3
import re

from bottle import response, request, post, get, route, run, template, HTTPResponse, static_file  # type: ignore

VERSION = "0.1"
DB_PATH = "../tmp/kanji-grapheditor.db"
DB = sqlite3.connect(DB_PATH)
DB.row_factory = sqlite3.Row

GRAPH_INITIAL_XML = os.getenv(
    "MOONSPEAK_GRAPH_INITIAL_XML",
    "<mxGraphModel><root><mxCell id=\"0\"/><mxCell id=\"1\" parent=\"0\"/></root></mxGraphModel>"
)

@get("/open")
def work():
    # set to return xml
    response.set_header("Content-Type", "text/xml;charset=UTF-8")

    # disable caching
    response.set_header("Pragma", "no-cache") # HTTP 1.0
    response.set_header("Cache-Control", "no-store")
    response.set_header("Expires", "0")

    try:
        c = DB.cursor()
        c.execute("SELECT * FROM diagrams where uuid = :uuid ;", dict(request.params))
        row = c.fetchone()
        return row["xml"]
    except Exception as e:
        print(f"Got exception {e}")
    return GRAPH_INITIAL_XML


@post("/save")
def submit():
    try:
        c = DB.cursor()
        # https://www.sqlite.org/lang_replace.html
        # https://www.sqlite.org/lang_UPSERT.html
        c.execute("""INSERT OR ABORT INTO diagrams VALUES (:uuid, :xml)
                ON CONFLICT(uuid) DO UPDATE SET xml=excluded.xml;
                """, dict(request.params))
        DB.commit()
    except Exception as e:
        return HTTPResponse(status=500, body="{}".format(e))

    # return a fake body because too lazy to unwrap properly in Elm
    return HTTPResponse(status=200, body="")


@get("/")
def index():
    return static("index.html")


@get("/<path:path>")
def static(path):
    if "index.html" in path:
        return static_file("index.html", root="../frontend/")
    return static_file(path, root="../frontend/")


def db_init():
    c = DB.cursor()
    c.execute("""CREATE TABLE diagrams (
            uuid TEXT NOT NULL UNIQUE
            , xml TEXT NOT NULL UNIQUE
            , PRIMARY KEY (uuid)
        );
        """)
    DB.commit()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Feature, run as "python main.py"')
    parser.add_argument('--host', type=str, default="0.0.0.0", help='hostname, e.g. 127.0.0.24')
    parser.add_argument('--port', type=int, default=80, help='port number')
    args = parser.parse_args()

    db_needs_init = (not os.path.isfile(DB_PATH)) or (
        os.path.getsize(DB_PATH) == 0)

    if db_needs_init:
        db_init()

    # other
    print("Running bottle server on port {}".format(args.port))
    run(host=args.host, port=args.port, debug=True)
