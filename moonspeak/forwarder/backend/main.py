#!/usr/bin/env python3
import os
import json
import sqlite3
import re
import logging
from urllib.parse import unquote_plus, urlparse

from bottle import route, run, get, static_file, request, HTTPResponse
from bs4 import BeautifulSoup
import requests
import socket

VERSION = "0.1"
MY_HOSTNAME = os.getenv("MOONSPEAK_DOMAIN")
logger = logging.getLogger(__name__)


def modify_root_doc(doc_text, node, service):
    soup = BeautifulSoup(doc_text, 'html.parser')
    base_tag = soup.new_tag("base", href="http://{}/router/{}/{}/".format(MY_HOSTNAME, node, service))
    try:
        soup.head.insert(0, base_tag)
    except AttributeError as e:
        logger.critical("This response has no <head> tag: {}".format(doc_text))
        # import pdb; pdb.set_trace()
    return str(soup)


def retrieve_url(url, req):
    logger.warn(f"Requesting {url}")

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


@route("/router/<node>/<service>", method=["GET"])
def router_root(node, service):
    # url = "http://{}.{}/{}".format(node, MY_HOSTNAME, service)
    url = "http://{}.{}".format(service, MY_HOSTNAME)
    r = retrieve_url(url, request)

    # modify returned content because we are requesting root doc
    new_content = modify_root_doc(r.content, node, service)
    # delete content-lenght so it will get recalculated
    del r.headers["content-length"]

    return HTTPResponse(body=new_content, status=r.status_code, headers=r.headers.items())


@route("/router/<node>/<service>/<path:re:.*>", method=["GET", "HEAD", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"])
def router(node, service, path):
    # url = "http://{}.{}/{}/{}".format(node, MY_HOSTNAME, service, path)
    url = "http://{}.{}/{}".format(service, MY_HOSTNAME, path)
    r = retrieve_url(url, request)

    # if r.status_code == 301:
    #     location_url = urlparse(r.headers["location"])
    #     # note: location_url.path already contains leading slash
    #     new_location_url = location_url._replace(netloc=MY_HOSTNAME)._replace(path=f"{service}{location_url.path}").geturl()
    #     r.headers["location"] = new_location_url

    if r.headers["content-type"] == "text/html":
        # modify returned content because we are requesting root doc
        new_content = modify_root_doc(r.content, node, service)
        # delete content-lenght so it will get recalculated
        del r.headers["content-length"]

    return HTTPResponse(body=r.content, status=r.status_code, headers=r.headers.items())


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Run as "python main.py"')
    parser.add_argument('--host', type=str, default="0.0.0.0", help='Host interfaec on which to bind')
    parser.add_argument('--port', type=int, default=80, help='port number')
    args = parser.parse_args()

    print("Running server on port {}".format(args.port))
    run(host=args.host, port=args.port, debug=True)
