#!/usr/bin/env python3

# there is no easy way around this: this service defines how the urls look
# because it creates new containers and gives them names accordingly
# containers are named as follows: s-SERVICE_NAME-u-USER_NAME, the "-" hyphen is used as the separator

# see: https://jpmens.net/2020/02/28/dial-a-for-ansible-and-r-for-runner/

import os
import secrets
import yaml
import datetime
import urllib.parse
from multiprocessing import Process
from multiprocessing import Queue as MPQueue # do not confuse with threading.Queue
from pathlib import Path

from bottle import route, run, get, request, HTTPResponse, template, static_file, default_app, response
from python_on_whales.docker_client import DockerClient

from spindown_process import spindown_process

import logging
LOGLEVEL = os.environ.get("LOGLEVEL", "DEBUG").upper()
logging.basicConfig(level=LOGLEVEL)
logger = logging.getLogger(__name__)

PORT_ROUTING = (os.getenv("MOONSPEAK_BROWSER_ROUTING", "dns") == "port")

MOONSPEAK_DISABLE_AUTH = os.getenv("MOONSPEAK_DISABLE_AUTH", "0")
FRONTEND_ROOT = "../frontend/src/"

ROOT_SERVICE_NAME = os.environ.get("MOONSPEAK_ROOT_SERVICE_NAME", "graph").lower()

QUEUE = MPQueue()

# in port routing mode the count is used to generate predictable open port numbers on request
PORT_ROUTING_COUNT = 1

APP = default_app()

def guid():
    return str(uuid.uuid4())

def submit_compose_up_task(unique_id, force_recreate=False):
    compose_files = [ Path("../resources/docker-compose-template.yml") ]

    if PORT_ROUTING:
        compose_files.append(Path("../resources/docker-compose-portmode-template.yml"))
        # see details in port mode docker compose template, basically this allows to publish service ports in predictable manner
        os.environ['MOONSPEAK_PORT_ROUTING_COUNT'] = str(PORT_ROUTING_COUNT)

    dockercli = DockerClient(compose_project_name=unique_id, compose_files=compose_files)
    logger.info(yaml.safe_dump(dockercli.compose.config(return_json=True)))

    if force_recreate:
        dockercli.compose.down(timeout=2)

    dockercli.compose.up(detach=True, remove_orphans=True)

    QUEUE.put(unique_id)

    return dockercli

@route("/api/new/", method=["GET"])
def new():
    # Check if a cookie is present happens when user clicks on sign up again instead of log in
    user_name = request.get_cookie("moonspeak_user_name")
    if user_name:
        # redirect user to his page, do not create new user
        # form redirect response manually to avoid sending hostname (use only root url)
        resp = HTTPResponse("", status=307)
        resp.set_header('Location', f"/handle/u-{user_name}-s-{ROOT_SERVICE_NAME}/")
        return resp

    if MOONSPEAK_DISABLE_AUTH == "1":
        user_name = guid()
    else:
        user_name = request.environ["OIDC_CLAIM_sub"]

    # fix user name in response cookie, expires 1 year from now in seconds
    response.set_cookie('moonspeak_user_name', user_name, max_age=60 * 60 * 24 * 365, path='/')

    if PORT_ROUTING:
        # to use different ports in port routing mode we must increment counter for each user
        global PORT_ROUTING_COUNT
        PORT_ROUTING_COUNT += 1

    # we want to keep the root_url as a complex URL object, not as a string
    root_url = urllib.parse.urlparse(
        urllib.parse.urlunparse(("", "", f"/router/route/u-{user_name}-s-{ROOT_SERVICE_NAME}/", "", "", ""))
    )

    dockercli = submit_compose_up_task(user_name)
    if dockercli:
        if PORT_ROUTING:
            # we need to adjust root_url to include host port, for port routing mode just hardcode "graph" and "80"
            container_name, host_port = dockercli.compose.port(ROOT_SERVICE_NAME, "80")
            # just hardcode request to root index.html in port routing and use "http" (not "https") for easy local testing
            root_url = root_url._replace(scheme="http", netloc="localhost:{}".format(host_port), path="/")

        logger.debug("Returning target url: {}".format(root_url))
        return template('index.template.html', template_lookup=[FRONTEND_ROOT], url=root_url.geturl(), title="manager", lang="en")

    return "Ooops, something went wrong! Please go back to the Home page."


@route("/api/handle/<target:re:.*>", method=["GET", "POST"])
def handle(target):
    service_name = None
    parts = request.path.split("/")
    for p in parts:
        if p.startswith("u-"):
            service_name = p
            break

    if not service_name:
        msg = "No 'u-' found in request: {}".format(request.url)
        logger.info(msg)
        long_msg = f"Error: manager received request to bring up {target}, however it can only handle requests like /handle/u-XXX-s-YYY/. Most likely router could not find your service and was redirected here. Check that this services is properly created in docker-compose."
        return HTTPResponse(body=long_msg, status=404)

    try:
        empty_match, user_name, container_name = re.split(r'u-|-s-', service_name)
    except ValueError:
        logger.info("Error parsing service_name, expected u-XXX-s-YYY, but found: {}".format(service_name))
        return HTTPResponse(status=404)

    if container_name != ROOT_SERVICE_NAME:
        # we only bring up user services when he requests ROOT_SERVICE_NAME explicitly 
        logger.info("Ignoring request to bring up '{}' because we only handle '{}' service name not '{}'".format(service_name, ROOT_SERVICE_NAME, container_name))
        return HTTPResponse(status=404)

    dockercli = submit_compose_up_task(user_name)
    if dockercli:
        # started users containeers, must fix url
        # take what was there initially (query params + fragment), change netloc to make url relative to root and set path
        root_url = request.urlparts._replace(scheme="", netloc="", path=f"/router/route/u-{user_name}-s-{ROOT_SERVICE_NAME}/")

        if PORT_ROUTING:
            # we need to adjust root_url to include host port, for port routing mode just expect ROOT_SERVICE_NAME aka "graph" and "80"
            container_name, host_port = dockercli.compose.port(ROOT_SERVICE_NAME, "80")
            # just hardcode request to root index.html in port routing and use "http" (not "https") for easy local testing
            root_url = root_url._replace(scheme="http", netloc="localhost:{}".format(host_port), path="/")

        logger.debug("Returning target url: {}".format(root_url))
        return template('index.template.html', template_lookup=[FRONTEND_ROOT], url=root_url.geturl(), title="manager", lang="en")

    return "Ooops, something went wrong! Please go back to the Home page."


if __name__ == "__main__":
    @get("/")
    def index():
        return "Go to <code>/handle/u-XXX-s-YYY</code>"

    @get("/<path:path>")
    def static(path):
        return static_file(path, root=FRONTEND_ROOT)

    import argparse

    parser = argparse.ArgumentParser(description='Run as "python main.py"')
    # "0.0.0.0" and "moonspeak.localhost" break on windows only "localhost" is portable
    parser.add_argument('--host', type=str, default=os.getenv("MOONSPEAK_HOST", "localhost"), help='hostname or ip')
    parser.add_argument('--port', type=int, default=os.getenv("MOONSPEAK_PORT", "8001"), help='port number')
    args = parser.parse_args()

    # start the background process as a child of bottle process
    Process(target=spindown_process, args=(QUEUE,)).start()

    APP.run(host=args.host, port=args.port)
