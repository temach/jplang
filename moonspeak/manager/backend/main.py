#!/usr/bin/env python3

# there is no easy way around this: this service defines how the urls look
# because it creates new containers and gives them names accordingly
# containers are named as follows: s-SERVICE_NAME-u-USER_NAME, the "-" hyphen is used as the separator

# see: https://jpmens.net/2020/02/28/dial-a-for-ansible-and-r-for-runner/

import os
import secrets
import yaml
import datetime
from multiprocessing import Process
from multiprocessing import Queue as MPQueue # do not confuse with threading.Queue
from pathlib import Path

from bottle import route, run, get, request, HTTPResponse, template, static_file, default_app
from python_on_whales.docker_client import DockerClient
from python_on_whales.exceptions import DockerException

from spindown_process import spindown_process


class AccessLogMiddleware:
    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        def wrapped(status, headers, *args):
            self.log_access(environ, status, headers)
            return start_response(status, headers, *args)
        return self.app(environ, wrapped)

    def log_access(self, environ, status_code, headers):
        method = environ['REQUEST_METHOD']
        # repeat wsgi_decode_dance from werkzeug here
        # see: https://github.com/pallets/werkzeug/blob/main/src/werkzeug/_internal.py#L149
        path = environ['PATH_INFO'].encode('latin1').decode()
        query = ''
        if environ['QUERY_STRING']:
            query = '?' + environ['QUERY_STRING']
        status = status_code
        log_message = f'{environ["REMOTE_ADDR"]} - [{self.get_time()}] "{method} {path}{query} HTTP/1.1" {status}'
        logger.info(log_message)

    def get_time(self):
        return datetime.datetime.utcnow().strftime('%d/%b/%Y:%H:%M:%S')


import logging
LOGLEVEL = os.environ.get("LOGLEVEL", "DEBUG").upper()
logging.basicConfig(level=LOGLEVEL)
logger = logging.getLogger(__name__)

DEVMODE = os.getenv("MOONSPEAK_DEVMODE", "1")

MOONSPEAK_THREADS = 1
DOMAIN = "moonspeak." + os.getenv("MOONSPEAK_TLD", "localhost")

FRONTEND_ROOT = "../frontend/src/"

QUEUE = MPQueue()

# in dev mode the count is used to generate predictable usernames (devmodeXX) and open port numbers on request
DEVMODE_COUNT = 1
DEVMODE_SERVICE_NAME = "graph"

def guid(nbytes=10):
    return secrets.token_hex(nbytes)

def submit_compose_up_task(unique_id, force_recreate=False):
    compose_files = [ Path("../resources/docker-compose-template.yml") ]

    if DEVMODE:
        compose_files.append(Path("../resources/docker-compose-devmode-template.yml"))
        # see details in devmode docker compose template, basically this allows to publish service ports in predictable manner
        os.environ['MOONSPEAK_DEVMODE_COUNT'] = str(DEVMODE_COUNT)

    dockercli = DockerClient(compose_project_name=unique_id, compose_files=compose_files)
    logger.info(yaml.safe_dump(dockercli.compose.config(return_json=True)))

    if force_recreate:
        dockercli.compose.down(timeout=2)

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
        msg = "No 'u-' found in request: {}".format(request.url)
        logger.info(msg)
        long_msg = f"Error: manager received request to bring up {target}, however it can only handle requests like /handle/u-XXX-s-YYY/. Most likely router could not find your service and was redirected here."
        return HTTPResponse(body="Erorr: manager received request to bring up ", status=404)

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
    return "Go to <code>/handle/u-XXX-s-YYY</code>"


@get("/<path:path>")
def static(path):
    return static_file(path, root=FRONTEND_ROOT)


def run_server(args):
    if DEVMODE:
        # this server definitely works on all platforms
        if args.uds:
            raise Exception("Uds socket not supported when MOONSPEAK_DEVMODE is active")
        run(host=args.host, port=args.port, debug=True)
    else:
        # this server definitely works on linux and is used in prod
        if args.uds:
            try:
                # handle the case when previous cleanup did not finish properly
                os.unlink(args.uds)
            except FileNotFoundError:
                # if there was nothing to unlink, thats good
                pass
            except Exception:
                logger.warn(f"Error trying to unlink existing unix socket {args.uds} before re-binding.", exc_info=True)
        bind_addr = args.uds if args.uds else f"{args.host}:{args.port}"
        import pyruvate
        try:
            # only use 1 thread, otherwise must add locks for sqlite and globals. Pyruvate uses threading model (see its source).
            # about GIL: https://opensource.com/article/17/4/grok-gil
            # threading vs asyncio (both are a pain): https://www.endpointdev.com/blog/2020/10/python-concurrency-asyncio-threading-users/
            # WSGI processes and threads: https://modwsgi.readthedocs.io/en/develop/user-guides/processes-and-threading.html
            # thread locals: https://github.com/python/cpython/blob/main/Lib/_threading_local.py
            assert MOONSPEAK_THREADS == 1, "Use only one thread or you must add locks. pyruvate uses threading model."
            pyruvate.serve(AccessLogMiddleware(default_app()), bind_addr, MOONSPEAK_THREADS)
        finally:
            # when the server is shutting down
            logger.warn("Shutting down server.")
            if args.uds:
                logger.info(f"Removing unix socket {args.uds}");
                os.unlink(args.uds)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Run as "python main.py"')
    parser.add_argument('--host', type=str, default=os.getenv("MOONSPEAK_HOST", "0.0.0.0"), help='hostname or ip, does not combine with unix sock')
    parser.add_argument('--port', type=int, default=os.getenv("MOONSPEAK_PORT", "8001"), help='port number')
    parser.add_argument('--uds', type=str, default=os.getenv("MOONSPEAK_UDS", ""), help='Path to bind unix domain socket e.g. "./service.sock", does not combine with TCP socket')
    args = parser.parse_args()

    # start the background process as a child of bottle process
    Process(target=spindown_process, args=(QUEUE,)).start()

    run_server(args)
