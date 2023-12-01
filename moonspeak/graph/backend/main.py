#!/usr/bin/env python3
import os
import json
import sqlite3
import re
import urllib
import datetime

from bottle import response, request, post, get, route, template, HTTPResponse, static_file, default_app  # type: ignore

DB_PATH = "../userdata/kanji-grapheditor.db"
# only check if threadsafety is not 3, see: https://docs.python.org/3/library/sqlite3.html#sqlite3.threadsafety
DB = sqlite3.connect(DB_PATH, check_same_thread=(sqlite3.threadsafety != 3))
DB.row_factory = sqlite3.Row

GRAPH_INITIAL_XML = os.getenv("MOONSPEAK_GRAPH_INITIAL_XML", None)

APP = default_app()

@get("/api/import")
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
        xml = row["xml"]
        print("Returning xml from db")
        return xml
    except Exception as e:
        print(f"Got exception {e}")
        if GRAPH_INITIAL_XML:
            print("Returning xml from env var")
            return GRAPH_INITIAL_XML
        else:
            print("Returning xml from static file")
            return static_file("graph.xml", root="../config/")


@post("/api/save")
def submit():
    vals = dict(request.params)

    if "uuid" not in vals:
        vals["uuid"] = "default"

    vals["xml"] = request.body.read()

    try:
        c = DB.cursor()
        # https://www.sqlite.org/lang_replace.html
        # https://www.sqlite.org/lang_UPSERT.html
        c.execute("""INSERT OR ABORT INTO diagrams VALUES (:uuid, :xml)
                ON CONFLICT(uuid) DO UPDATE SET xml=excluded.xml;
                """, vals)
        DB.commit()
    except Exception as e:
        return HTTPResponse(status=500, body="{}".format(e))

    return HTTPResponse(status=200)


def init():
    db_needs_init = (not os.path.isfile(DB_PATH)) or (
        os.path.getsize(DB_PATH) == 0)

    if db_needs_init:
        c = DB.cursor()
        c.execute("""CREATE TABLE diagrams (
                uuid TEXT NOT NULL UNIQUE
                , xml TEXT NOT NULL UNIQUE
                , PRIMARY KEY (uuid)
            );
            """)
        DB.commit()


if __name__ == "__main__":
    # when running without apache, add code to serve static files
    @get("/config/<filename>")
    def config(filename):
        return static_file(filename, root="../config/")

    @get("/")
    def index():
        return static("index.html")

    @get("/<path:path>")
    def static(path):
        FRONTEND_ROOT="../frontend/src/main/webapp/"
        if "index.html" in path:
            return static_file("index.html", root=FRONTEND_ROOT)
        return static_file(path, root=FRONTEND_ROOT)


    import argparse
    parser = argparse.ArgumentParser(description='Run as "python main.py"')
    parser.add_argument('--host', type=str, default=os.getenv("MOONSPEAK_HOST", "localhost"), help='hostname or ip')
    parser.add_argument('--port', type=int, default=os.getenv("MOONSPEAK_PORT", "8041"), help='port number')
    args = parser.parse_args()

    init()
    APP.run(host=args.host, port=args.port)
