#!/usr/bin/env python3
import os
import json
import sqlite3
import re
import logging
from urllib.parse import unquote_plus, urlparse
import urllib3

from bottle import route, run, get, static_file, request, HTTPResponse, error
from bs4 import BeautifulSoup
import requests
import socket

VERSION = "0.1"
MOONSPEAK_DOMAIN = os.getenv("MOONSPEAK_DOMAIN", "moonspeak.test")
MOONSPEAK_DEBUG = os.getenv("MOONSPEAK_DEBUG", True)
logger = logging.getLogger(__name__)


def modify_root_doc(doc_text, root_url):
    soup = BeautifulSoup(doc_text, 'html.parser')
    base_tag = soup.new_tag("base", href=root_url)
    try:
        soup.head.insert(0, base_tag)
    except AttributeError as e:
        logger.critical("This response has no <head> tag: {}".format(doc_text))
        # import pdb; pdb.set_trace()
    return str(soup)


def retrieve_url(url, req):
    logger.warning(f"Requesting {url}")

    # in bottle request.headers is read-only so we create a new object to pass to requests
    # Host must be deleted so network transport can infer the correct Host header from url
    # Content-Length must be deleted because bottle always includes it (in case of POST its set to '')
    bad_headers = frozenset(('Host', 'Content-Length'))
    headers = {k: v for k,v in req.headers.items() if k not in bad_headers}

    r = requests.request(req.method, url, headers=headers, data=req.body, allow_redirects=False)

    # remove hop-by-hop headers
    # see: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Connection
    # see: https://datatracker.ietf.org/doc/html/rfc2616.html#section-13.5.1
    # list of hop-by-hop headers: https://github.com/python/cpython/blob/main/Lib/wsgiref/util.py#L151
    if "connection" in r.headers:
        # happens with nginx as reverse-proxy
        del r.headers["connection"]

    return r


def handle(node, service, path=""):
    url = urlparse("")._replace(
        scheme="http",
        netloc="{}.{}".format(service, MOONSPEAK_DOMAIN),
        path=path,
        query=request.urlparts.query,
    ).geturl()

    if MOONSPEAK_DEBUG and ":" in service:
        # when running on localhost its nice to be able to specify the port too
        # e.g. http://moonspeak.test/router/localhost/hud-demouser-aaa:8888/
        # becomes: http://hud-demouser-aaa.moonspeak.test:8888/
        logger.warning("Adding debug routes, so you will never see 404 from router")
        service_name, service_port = service.split(":")
        url = urlparse(url)._replace(
            netloc="{}.{}:{}".format(service_name, MOONSPEAK_DOMAIN, service_port),
        ).geturl()


    try:
        r = retrieve_url(url, request)
    except urllib3.exceptions.NewConnectionError as e: 
        msg = "{}: {}".format(str(e), url)
        logger.exception(msg)
        return HTTPResponse(body=msg, status=503)

    # if r.status_code == 301:
    #     location_url = urlparse(r.headers["location"])
    #     # note: location_url.path already contains leading slash
    #     new_location_url = location_url._replace(netloc=MOONSPEAK_DOMAIN)._replace(path=f"{service}{location_url.path}").geturl()
    #     r.headers["location"] = new_location_url

    body = r.content
    if "text/html" in r.headers["content-type"]:
        # modify returned content because we are requesting root doc
        root_url = urlparse(url)._replace(
            netloc=request.headers["host"],
            # must use the actual path as root_url, otherwise relative paths "../common/" break
            path="/router/{}/{}/{}".format(node, service, path),
            query="",
        ).geturl()

        body = modify_root_doc(r.content, root_url)
        # delete content-lenght so it will get recalculated
        del r.headers["content-length"]

    return HTTPResponse(body=body, status=r.status_code, headers=r.headers.items())


@route("/router/<node>/<service>", method=["GET", "HEAD", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"])
def forward_root(node, service):
    return handle(node, service)

@route("/router/<node>/<service>/<path:re:.*>", method=["GET", "HEAD", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"])
def forward(node, service, path):
    return handle(node, service, path)


# ONLY for debug/development
# this is roughly equivalent to the gateway nginx configuration
def handle_debug_routing(error):
    assert MOONSPEAK_DEBUG, 'Only create debug routing when debugging/developing'

    # remove leading and trailing whitespace and slashes
    path = request.path.strip().strip("/")

    # get the first parameter and all parameters except the first
    service_name = path.split("/")[0]
    service_path = "/".join( path.split("/")[1:] )

    return handle('localhost', service_name, service_path)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Run as "python main.py"')
    parser.add_argument('--host', type=str, default="0.0.0.0", help='Host interfaec on which to bind')
    parser.add_argument('--port', type=int, default=80, help='port number')
    args = parser.parse_args()

    if MOONSPEAK_DEBUG:
        error(404)(handle_debug_routing)

    print("Running server on port {}".format(args.port))
    run(host=args.host, port=args.port, debug=True)
