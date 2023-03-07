#!/usr/bin/env python3
import os
import json
import sqlite3
import re
import urllib
from urllib.parse import unquote
import datetime

from bottle import response, request, post, get, route, run, template, HTTPResponse, static_file, default_app  # type: ignore

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

import logging
LOGLEVEL = os.environ.get("LOGLEVEL", "DEBUG").upper()
logging.basicConfig(level=LOGLEVEL)
logger = logging.getLogger(__name__)

DEVMODE = os.environ.get("MOONSPEAK_DEVMODE", "1")

MOONSPEAK_THREADS = 1
DB_PATH = "../userdata/kanji-grapheditor.db"
DB = sqlite3.connect(DB_PATH, check_same_thread=(MOONSPEAK_THREADS != 1))
DB.row_factory = sqlite3.Row

FRONTEND_ROOT="../frontend/src/main/webapp/"
GRAPH_INITIAL_XML = os.getenv("MOONSPEAK_GRAPH_INITIAL_XML", None)


@get("/config/<filename>")
def config(filename):
    return static_file(filename, root="../config/")

@get("/import")
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

@post("/save")
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


@get("/")
def index():
    return static("index.html")


@get("/<path:path>")
def static(path):
    if "index.html" in path:
        return static_file("index.html", root=FRONTEND_ROOT)
    return static_file(path, root=FRONTEND_ROOT)


def db_init():
    c = DB.cursor()
    c.execute("""CREATE TABLE diagrams (
            uuid TEXT NOT NULL UNIQUE
            , xml TEXT NOT NULL UNIQUE
            , PRIMARY KEY (uuid)
        );
        """)
    DB.commit()


def run_server(args):
    if DEVMODE:
        # this server definitely works on all platforms
        if args.uds:
            raise Exception("Uds socket not supported when MOONSPEAK_DEVMODE is active")
        run(host=args.host, port=args.port, debug=True)
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
            pyruvate.serve(AccessLogMiddleware(default_app()), bind_addr, MOONSPEAK_THREADS)
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
    parser.add_argument('--port', type=int, default=os.getenv("MOONSPEAK_PORT", "8041"), help='port number')
    parser.add_argument('--uds', type=str, default=os.getenv("MOONSPEAK_UDS", ""), help='Path to bind unix domain socket e.g. "./service.sock", does not combine with TCP socket')
    args = parser.parse_args()

    db_needs_init = (not os.path.isfile(DB_PATH)) or (
        os.path.getsize(DB_PATH) == 0)

    if db_needs_init:
        db_init()

    run_server(args)
