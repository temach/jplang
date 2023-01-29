#!/usr/bin/env python3

# see: https://jpmens.net/2020/02/28/dial-a-for-ansible-and-r-for-runner/

import os
import logging
import pathlib
import json
import secrets
import threading
from multiprocessing import Process, SimpleQueue

from jinja2 import Environment, FileSystemLoader, select_autoescape
from bottle import route, run, get, request, HTTPResponse
from python_on_whales import DockerClient

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

DOMAIN = os.getenv("MOONSPEAK_DOMAIN", "moonspeak.localhost")
DEPLOY_SECRET = os.getenv("MOONSPEAK_DEPLOY_SECRET", "secret")

# load templates
JINJA_ENV = Environment(
    loader=FileSystemLoader(pathlib.Path("../resources/")),
    autoescape=select_autoescape()
)
DOCKER_COMPOSE_TEMPLATE = JINJA_ENV.get_template("docker-compose.jinja-template.yml")

RUNNING_PROJECTS = []

# start the background process as a child of bottle process
QUEUE = SimpleQueue()
Process(target=background_task, args=(QUEUE,)).start()


def guid(nbytes=10):
    return secrets.token_hex(nbytes)


def submit_deployment_task(unique_id, node):
    yaml_string = DOCKER_COMPOSE_TEMPLATE.render(
        moonspeak_domain = DOMAIN,
        moonspeak_user = unique_id,
        moonspeak_tag = "latest",
    )
    logger.debug(yaml_string)

    # TODO: check that yaml is valid after templating the string
    # this is to protect against bad characters, XSS, injections

    fname = f"../userdata/docker-compose.user-{unique_id}.yml"
    with open(fname, "w") as f:
        f.write(yaml_string)

    docker = DockerClient(compose_project_name=unique_id, compose_files=[fname])
    docker.compose.up(detach=True)
    RUNNING_PROJECTS.append(docker)

    QUEUE.put(unique_id)

    # generate service names
    moonspeak_graph_service = "graph-{}".format(unique_id)
    user_unique_url = "http://{}/router/route/{}".format(DOMAIN, moonspeak_graph_service)
    return user_unique_url


@route("/<deploy_secret>/new", method=["GET"])
@route("/<deploy_secret>/new/<moonspeak_user>", method=["GET"])
def deploy(deploy_secret, moonspeak_user):
    if not secrets.compare_digest(deploy_secret, DEPLOY_SECRET):
        return HTTPResponse(status=401)

    # select the node on which to deploy
    node = "localhost"

    # generate unique id
    unique_id = moonspeak_user if moonspeak_user else guid(6)

    # ask to spin up personal containers for this user
    user_unique_url = submit_deployment_task(unique_id, node)

    # return the url of root service
    return {
        "user_unique_url": user_unique_url,
    }


def background_task(q):
    while True:
        # block until someone signals that its time to wake up
        data = QUEUE.get()

        docker = DockerClient(compose_project_name=unique_id, compose_files=[fname])
        docker.compose.up(detach=True)
        RUNNING_PROJECTS.append(docker)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Run as "python main.py"')
    parser.add_argument('--port', type=int, default=80, help='port number')
    args = parser.parse_args()

    logger.debug("Running server on port {}".format(args.port))
    run(host="0.0.0.0", port=args.port, debug=True)
