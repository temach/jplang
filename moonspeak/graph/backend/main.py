#!/usr/bin/env python3
import os
import json
import sqlite3
import re
import urllib
import datetime
import traceback

from bottle import response, request, post, get, route, template, HTTPResponse, static_file, default_app  # type: ignore

GRAPH_INITIAL_XML = os.getenv("MOONSPEAK_GRAPH_INITIAL_XML", None)
USERDATA_GRAPH_PATH = '../userdata/graph.xml'

APP = default_app()

@get("/api/import")
def work():
    # set to return xml
    response.set_header("Content-Type", "text/xml;charset=UTF-8")

    # disable caching
    response.set_header("Pragma", "no-cache") # HTTP 1.0
    response.set_header("Cache-Control", "no-store")
    response.set_header("Expires", "0")

    if os.path.exists(USERDATA_GRAPH_PATH):
        print("Returning xml from custom userdata")
        return static_file("graph.xml", root="../userdata/")
    elif GRAPH_INITIAL_XML:
        print("Returning xml from static env var")
        return GRAPH_INITIAL_XML
    else:
        print("Returning xml from static config file")
        return static_file("graph.xml", root="../config/")


@post("/api/save")
def submit():
    try:
        data = request.body.read()
        with open(USERDATA_GRAPH_PATH, 'wb') as file:
            file.write(data)
    except Exception as e:
        print(traceback.format_exc())
        return HTTPResponse(status=500, body="{}".format(e))

    return HTTPResponse(status=200)


def init():
    pass


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
