#!/usr/bin/env python3
import os
import logging
import json
import socket

from uuid import uuid4

import requests

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
DOMAIN = os.getenv("MOONSPEAK_DOMAIN")

@app.get("/login")
async def login(request: Request):
    # generate unique url, deploy services and redirect
    try:
        # select the node on which to deploy
        node = "node1"

        # generate unique id
        unique_id = "xxxxx"

        # ask to spin up personal containers for this user 
        deploy_url = "http://{}/router/{}/deploy/new/{}".format(DOMAIN, node, unique_id)
        r = requests.post(deploy_url)

        if r.ok:
            # return the url of root service 
            unique_service = "hud-{}".format(unique_id)
            user_unique_url = "/router/{}/{}".format(node, unique_service)
            return RedirectResponse(user_unique_url)

    except Exception as e:
        print(f"Exception during login: {e}")

    # redirect to our error page
    service_error_page = "/login/error"
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
