#!/usr/bin/env python3
import os
import json
import re

from bottle import response, route, run, get, static_file, request, HTTPResponse

VERSION = "0.1"
HUD_CONFIG = os.getenv(
    "MOONSPEAK_HUD_CONFIG_JSON",
    "{\"urls\":[\"/plus/\",\"/router/localhost/graph-demouser-bbb\"]}"
)

@get("/")
def index():
    return static_file("index.html", root="../frontend/")

@get("/static/<filepath:re:.*\.(css|js)>")
def static(filepath):
    return static_file(filepath, root="../frontend/static/")

@get("/hud_config.json")
def static():
    response.content_type = "application/json"
    return HUD_CONFIG

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Run as "python main.py"')
    parser.add_argument('--host', type=str, default="0.0.0.0", help='hostname, e.g. 127.0.0.1')
    parser.add_argument('--port', type=int, default=80, help='port number')
    args = parser.parse_args()

    print("Running server on port {}".format(args.port))
    import logging
    run(host=args.host, port=args.port, debug=True)
