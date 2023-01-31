#!/usr/bin/env python3

# see: https://jpmens.net/2020/02/28/dial-a-for-ansible-and-r-for-runner/

import os
import logging
import pathlib
import json
import secrets
import threading
from multiprocessing import Process, SimpleQueue
from urllib.parse import urlparse
from pathlib import Path
from pprint import pprint

from jinja2 import Environment, FileSystemLoader, select_autoescape
from bottle import route, run, get, request, HTTPResponse, redirect, template, static_file
from python_on_whales import DockerClient

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

DOMAIN = os.getenv("MOONSPEAK_DOMAIN", "moonspeak.localhost")
DEPLOY_SECRET = os.getenv("MOONSPEAK_DEPLOY_SECRET", "secret")
STOP_AFTER_IDLE_SECONDS = int(os.getenv("MOONSPEAK_MINUTES_TO_IDLE", "20")) * 60
FRONTEND_ROOT = "../frontend/src/"

# load templates
JINJA_ENV = Environment(
    loader=FileSystemLoader(pathlib.Path("../resources/")),
    autoescape=select_autoescape()
)
DOCKER_COMPOSE_TEMPLATE = JINJA_ENV.get_template("docker-compose.jinja-template.yml")

QUEUE = SimpleQueue()


def guid(nbytes=10):
    return secrets.token_hex(nbytes)


def submit_compose_up_task(unique_id):
    yaml_string = DOCKER_COMPOSE_TEMPLATE.render(
        moonspeak_domain = DOMAIN,
        moonspeak_user = unique_id,
        moonspeak_tag = "latest",
    )
    logger.debug(yaml_string)

    # TODO: check that yaml is valid after templating the string
    # this is to protect against bad characters, XSS, injections

    fpath = Path(f"../userdata/docker-compose.{unique_id}.yml")

    if not fpath.exists():
        with fpath.open(mode='w') as f:
            f.write(yaml_string)

    dockercli = DockerClient(compose_project_name=unique_id, compose_files=[str(fpath)])
    dockercli.compose.up(detach=True)

    QUEUE.put(unique_id)

    return True



@route("/handle/<target:re:.*>", method=["GET", "POST"])
def handle(target):
    # try to get username from url, if not found then this is not something we can handle
    service = request.query.service
    user = request.query.user
    if not service or not user:
        logger.info("No service or user found in request")
        return HTTPResponse(code=503)

    if submit_compose_up_task(user):
        # if you could start users containeers then build a full url and place the user to wait for this url
        root_url = urlparse(target)._replace(scheme="http", netloc=DOMAIN)
        return template('index.template.html', template_lookup=[FRONTEND_ROOT], url=root_url.geturl(), title="manager", lang="en")

    return "Ooops, something went wrong! Please go back to the Home page."


@route("/test", method=["GET", "POST"])
def test():
    return "This should be the user's personal workspace (and actually is just a test API handle)"


def background_task(event_queue):
    import docker
    import datetime
    import re

    # Create a Docker client object
    client = docker.from_env()
    re_user_name = re.compile("-user-([^.]+)")
    force_stop_timeout = 15

    while True:
        # block until someone signals that its time to wake up
        data = event_queue.get()

        all_containers = client.containers.list(all=True)

        user_containers = {}
        for c in all_containers:
            match = re_user_name.match(c.name)
            if match:
                # this is a user container
                username = match.group(1)
                if username in user_containers:
                    # add this container to this user
                    user_containers[username].append(c)
                else:
                    user_containers[username] = []

        # find and spin down user containers that do not have any logs for the last X minutes
        for username, containers in user_containers.items():
            idle = True

            for container in containers:
                # Get the logs of the container
                logs = container.logs(tail=1, timestamps=True)
                logs_str = logs.decode()
                # only interested in first element of latest log line
                log = logs_str.split("\n").pop(0)
                log_time, _ = log.split(" ", 1)
                timestamp = datetime.datetime.strptime(log_time[:19], '%Y-%m-%dT%H:%M:%S')
                if datetime.datetime.now() - timestamp > datetime.timedelta(minutes=20):
                    print(f'Idle container: {container.name} Last Log Timestamp: {timestamp}')
                    idle = False
                    break

            if idle:
                for container in containers:
                    try:
                        container.stop(timeout=force_stop_timeout)
                    except Exception as error:
                        # should be stopped forcibly anyway, so log and ignore
                        logger.info(error)
                        continue


@get("/")
def index():
    return "Go to <code>/handle/username</code>"


@get("/<path:path>")
def static(path):
    return static_file(path, root=FRONTEND_ROOT)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Run as "python main.py"')
    parser.add_argument('--port', type=int, default=8080, help='port number')
    args = parser.parse_args()

    # start the background process as a child of bottle process
    Process(target=background_task, args=(QUEUE,)).start()

    logger.debug("Running server on port {}".format(args.port))
    run(host="0.0.0.0", port=args.port, debug=True)
