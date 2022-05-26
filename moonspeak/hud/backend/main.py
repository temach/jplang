#!/usr/bin/env python3
import os
import json
import re

from bottle import route, run, get, static_file, request, HTTPResponse

VERSION = "0.1"

@get("/")
def index():
    return static_file("index.html", root="../frontend/")

@get("/static/<filepath:re:.*\.(css|js)>")
def static(filepath):
    return static_file(filepath, root="../frontend/static/")

@get("/hud_config.json")
def static():
    return static_file("hud_config.json", root="../tmp/")

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Run as "python main.py"')
    parser.add_argument('--port', type=int, default=80, help='port number')
    args = parser.parse_args()

    print("Running server on port {}".format(args.port))
    import logging
    run(host="0.0.0.0", port=args.port, debug=True)
