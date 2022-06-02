#!/usr/bin/env python3
import os
import logging
import json
import socket

from uuid import uuid4

import requests

from fastapi import FastAPI
from fastapi.requests import Request
from fastapi.responses import Response, JSONResponse, RedirectResponse, HTMLResponse

app = FastAPI()

# to use different backends for session storage (InMemory, Cookie, Redis)
# from starsessions import SessionMiddleware, InMemoryBackend
# SESSION_BACKEND = InMemoryBackend()
# app.add_middleware(
#     SessionMiddleware, https_only=True, backend=SESSION_BACKEND, autoload=True
# )

LOGGER = logging.getLogger(__name__)
DOMAIN = os.getenv("MOONSPEAK_DOMAIN")
DEPLOY_SECRET = os.getenv("MOONSPEAK_DEPLOY_SECRET")

ROW = [0,1,2,3,4,5,6,7]

def nice_id():
    return "xxxxx" + str(ROW.pop(0))

@app.get("/new")
async def login(request: Request):
    # select the node on which to deploy
    node = "node1"

    # generate unique id
    unique_id = nice_id()

    # ask to spin up personal containers for this user 
    deploy_url = f"http://{DOMAIN}/router/{node}/deploy/new/{DEPLOY_SECRET}/{unique_id}"

    try:
        # todo: change to post
        r = requests.get(deploy_url)

        if r.ok:
            data = r.json()
            LOGGER.warn(data)
            # return the url of root service 
            user_unique_url = data["url"]
            html = """<h1>We are loading your session!</h1>
                        <p>Please wait just a short while and <a href="{user_unique_url}">follow this link</a></p>
                        <p>Meanwhile save this link somewhere safe and secret, its your personal access url.</p>
                    """.format(user_unique_url)
            return HTMLResponse(html, status_code=200)

    except requests.exceptions.ReadTimeout:
        html = """<h1>We failed to load your session!</h1>
                    <p>Please wait 2 minutes and <a href="/login/new">try again</a></p>
                    <p>We registered this problem and will make sure it does not happen again.</p>
                """
        return HTMLResponse(html, status_code=500)

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
