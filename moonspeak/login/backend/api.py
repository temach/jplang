#!/usr/bin/env python3
import os
import logging
import json
import socket

from uuid import uuid4

import requests
import ansible_runner

from fastapi import FastAPI
from fastapi.requests import Request
from fastapi.responses import Response, JSONResponse, RedirectResponse

app = FastAPI()

# to use different backends for session storage (InMemory, Cookie, Redis)
# from starsessions import SessionMiddleware, InMemoryBackend
# SESSION_BACKEND = InMemoryBackend()
# app.add_middleware(
#     SessionMiddleware, https_only=True, backend=SESSION_BACKEND, autoload=True
# )

LOGGER = logging.getLogger(__name__)

HOSTNAME = socket.gethostname()


def spin_up_containers(unique_id):

    # read ansible and execute on localhost (uses /var/run/docker.sock)
    r = ansible_runner.run(private_data_dir='../resources', playbook='services.yml')
    print("{}: {}".format(r.status, r.rc))
    # successful: 0
    for each_host_event in r.events:
        print(each_host_event['event'])
    print("Final status:")
    print(r.stats)
    with open(config_path, "r") as yaml_config:
        config = yaml.load(yaml_config, Loader=yaml.SafeLoader)

    services = {
        "hud": {


        }
        "hud-{}",
        "grapheditor-{}",
        "submit-{}",
        "workelements-{}",
    }
    services = [s.format(str(uuid4())) for s in services]

    for name in services:
    build_args = {
        "RAW_IMAGE_NAME": full_tag,
        "WRAPPER_BINARY_PATH": str(wrapper_binary_path),
    }
    try:
        image, logs = client.images.build(path=".", dockerfile="docker/Dockerfile_upgrade_wrapper.template", buildargs=build_args, tag=full_tag, pull=False)
        for line in logs:
            logger.debug(line)
    except docker.errors.BuildError as e:
        for line in e.build_log:
            logger.error(line)
        logger.exception(f"Could not build image {full_tag}")
        continue

@app.get("/login")
async def login(request: Request):
    # generate unique url, deploy services and redirect
    try:
        # select the node on which to deploy
        node = "node1"

        # generate unique id
        unique_id = "aaa"

        # ask to spin up personal containers for this user 
        spin_up_containers()

        # return the url of root service 
        unique_service = "hud-{}".format(unique_id)
        user_unique_url = "/router/{}/{}".format(node, unique_service)
        return RedirectResponse(user_unique_url)
    except Exception as e:
        print(f"Exception during login: {e}")

    # redirect to our error page
    service_name = socket.gethostname()
    service_error_page = "/{}/error".format(service_name)
    return RedirectResponse(service_error_page)

@app.get("/error")
async def login(request: Request):
    return """<h1>We failed to load your session!</h1>
                <p>Please wait 2 minutes and <a href="/login/login">try again</a></p>
                <p>We registered this problem and will make sure it does not happen again.</p>
            """

# @app.post("/login")
# async def login(request: Request):
#     # # handle case if user is already logged in, just redirect to his url
#     # if "user" in request.session:
#     #     user_url = request.session["user"]["url"]
#     #     return RedirectResponse(user_url)
# 
# 
#     # generate url, deploy it and redirect
#     
#         del request.session["user"]
#         return Response(status_code=200)
#     return Response(status_code=401)
#
# @app.get("/whoami")
# async def login(request: Request):
#     if "user" in request.session:
#         data = {
#             "url": request.session["user"]["url"],
#         }
#         return JSONResponse(data)
#     return Response(status_code=401)
#
# @app.get("/logout")
# async def login(request: Request):
#     if "user" in request.session:
#         del request.session["user"]
#         return RedirectResponse("/")
#     return Response(status_code=401)
