#!/usr/bin/env python3

# there is no easy way around this: this service defines how the urls look
# because it creates new containers and gives them names accordingly
# containers are named as follows: s-SERVICE_NAME-u-USER_NAME, the "-" hyphen is used as the separator

# see: https://jpmens.net/2020/02/28/dial-a-for-ansible-and-r-for-runner/

import os
import logging
import pathlib
import json
import secrets
import threading
import yaml
from multiprocessing import Process
from multiprocessing import Queue as MPQueue # do not confuse with threading.Queue
from pathlib import Path
from pprint import pprint

from bottle import route, run, get, request, HTTPResponse, redirect, template, static_file
from python_on_whales import DockerClient
from python_on_whales.exceptions import DockerException

from spindown_process import spindown_process

logger = logging.getLogger(__name__)
LOGLEVEL = os.environ.get("LOGLEVEL", "DEBUG").upper()
logging.basicConfig(level=LOGLEVEL)

DOMAIN = os.getenv("MOONSPEAK_DOMAIN", "moonspeak.localhost")
DEVMODE = os.getenv("MOONSPEAK_DEVMODE", "1")

FRONTEND_ROOT = "../frontend/src/"

QUEUE = MPQueue()

# in dev mode the count is used to generate predictable usernames (devmodeXX) and open port numbers on request
DEVMODE_COUNT = 1
DEVMODE_SERVICE_NAME = "graph"

def guid(nbytes=10):
    return secrets.token_hex(nbytes)

def submit_compose_up_task(unique_id, force_recreate=False):
    compose_files = [ str(Path("../resources/docker-compose-template.yml")) ]

    if DEVMODE:
        compose_files.append(str(Path("../resources/docker-compose-devmode-template.yml")))
        # see details in devmode docker compose template, basically this allows to publish service ports in predictable manner
        os.environ['MOONSPEAK_DEVMODE_COUNT'] = str(DEVMODE_COUNT)

    dockercli = DockerClient(compose_project_name=unique_id, compose_files=compose_files)
    logger.info(yaml.safe_dump(dockercli.compose.config(return_json=True)))

    dockercli.compose.up(detach=True, remove_orphans=True)

    QUEUE.put(unique_id)

    return dockercli


# to test locally query with empty <target>, e.g. localhost:8080/handle/
# devmode will handle the rest
@route("/handle/<target:re:.*>", method=["GET", "POST"])
def handle(target):
    # the target URL here is new or old url that should have worked, manager needs to figure out if it can make it work
    # import pdb; pdb.set_trace()

    service_name = None
    parts = request.path.split("/")
    for p in parts:
        if p.startswith("u-"):
            service_name = p
            break

    if DEVMODE and not service_name:
        global DEVMODE_COUNT
        DEVMODE_COUNT += 1
        # allow to have empty servicename, we will just generate one using a counter
        service_name = "u-devmode{}-s-{}".format(DEVMODE_COUNT, DEVMODE_SERVICE_NAME)

    if not service_name:
        logger.info("No 'u-' found in request: {}".format(request.url))
        return HTTPResponse(status=404)

    try:
        _, user_name, _, service_name = service_name.split("-")
    except ValueError:
        logger.info("Error parsing service_name, expected u-XXX-s-YYY, but found: {}".format(service_name))
        return HTTPResponse(status=404)

    dockercli = submit_compose_up_task(user_name)
    if dockercli:
        # started users containeers, must fix url
        # take what was there initially (query params + fragment), change netloc and leave only the trailing part of path
        root_url = request.urlparts._replace(scheme="https", netloc=DOMAIN, path=target)

        if DEVMODE:
            # ugly hacks for nice and easy dev mode
            # we need to adjust root_url to include host port, for dev mode just hardcode "graph" and "80"
            try:
                container_name, host_port = dockercli.compose.port(DEVMODE_SERVICE_NAME, "80")
            except DockerException:
                logger.warn("Previously you launched this user's services without DEVMODE enabled, so they have no open ports for you to connect!")
                logger.warn("I will shut them down and relaunch with DEVMODE enabled, give me a minute and try the same URL again")
                dockercli = submit_compose_up_task(user_name, force_recreate=True)
                container_name, host_port = dockercli.compose.port(DEVMODE_SERVICE_NAME, "80")
            # just hardcode request to root index.html in devmode and use "http" (not "https") for easy local testing
            root_url = root_url._replace(scheme="http", netloc="{}:{}".format(root_url.netloc, host_port), path="/")

        logger.debug("Returning target url: {}".format(root_url))
        return template('index.template.html', template_lookup=[FRONTEND_ROOT], url=root_url.geturl(), title="manager", lang="en")

    return "Ooops, something went wrong! Please go back to the Home page."


@get("/")
def index():
    return "Go to <code>/handle/s-XXX-u-YYY</code>"


@get("/<path:path>")
def static(path):
    return static_file(path, root=FRONTEND_ROOT)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Run as "python main.py"')
    parser.add_argument('--port', type=int, default=os.getenv("MOONSPEAK_PORT", 8010), help='port number')
    args = parser.parse_args()

    # start the background process as a child of bottle process
    Process(target=spindown_process, args=(QUEUE,)).start()

    logger.debug("Running server on port {}".format(args.port))
    run(host="0.0.0.0", port=args.port, debug=True)
