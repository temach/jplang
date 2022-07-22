#!/usr/bin/env python3
import os
import json
import re

from bottle import response, route, run, get, static_file, request, HTTPResponse

VERSION = "0.1"
HUD_CONFIG = os.getenv("MOONSPEAK_HUD_CONFIG_JSON", None)

@get("/")
def index():
    return static_file("index.html", root="../frontend/")

@get("/static/<filepath:re:.*\.(css|js)>")
def static(filepath):
    return static_file(filepath, root="../frontend/static/")

@get("/config/hud.json")
def hud_config():
    response.content_type = "application/json"

    if HUD_CONFIG:
        return HUD_CONFIG
    else:
        return static_file("config/hud.json", root="../frontend/")

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Run as "python main.py"')
    parser.add_argument('--host', type=str, default="0.0.0.0", help='hostname, e.g. 127.0.0.1')
    parser.add_argument('--port', type=int, default=80, help='port number')
    args = parser.parse_args()

    print("Running server on port {}".format(args.port))
    import logging
    run(host=args.host, port=args.port, debug=True)
