#!/usr/bin/env python3

# see: https://jpmens.net/2020/02/28/dial-a-for-ansible-and-r-for-runner/

import os
import logging
import json
import socket
from uuid import uuid4

import ansible_runner
from fastapi import FastAPI
from fastapi.responses import JSONResponse


app = FastAPI()

LOGGER = logging.getLogger(__name__)

DOMAIN = os.getenv("MOONSPEAK_DOMAIN")
NODE = os.getenv("MOONSPEAK_NODE")


@app.get("/new/{unique_id}")
async def login(unique_id: str):

    # read template definitions
    with open("../resources/templates/moonspeak_hud_config.json", "r") as f:
        hud_template = f.read()

    with open("../resources/templates/moonspeak_graph_initial.xml", "r") as f:
        graph_template = f.read()

    with open("../resources/templates/extravars", "r") as f:
        ansible_vars_template = f.read()

    # collect the variables and fill in templates
    moonspeak_hud_service = "hud-{}".format(unique_id)
    moonspeak_graph_service = "graph-{}".format(str(uuid4()))
    moonspeak_submit_service = "submit-{}".format(str(uuid4()))
    moonspeak_workelements_service = "workelements-{}".format(str(uuid4()))

    moonspeak_hud_config_json = hud_template.format(
        moonspeak_domain = DOMAIN,
        moonspeak_graph_service = moonspeak_graph_service,
        moonspeak_node = NODE,
    )
 
    moonspeak_graph_initial_xml = graph_template.format(
        moonspeak_node = NODE,
        moonspeak_domain = DOMAIN,
        moonspeak_hud_service = moonspeak_hud_service,
        moonspeak_graph_service = moonspeak_graph_service,
        moonspeak_submit_service = moonspeak_submit_service,
        moonspeak_workelements_service = moonspeak_workelements_service,
    )

    # this will be supplied to ansible
    extravars_content = ansible_vars_template.format(
        moonspeak_domain = DOMAIN,
        moonspeak_hud_service = moonspeak_hud_service,
        moonspeak_graph_service = moonspeak_graph_service,
        moonspeak_submit_service = moonspeak_submit_service,
        moonspeak_workelements_service = moonspeak_workelements_service,

        moonspeak_hud_config_json = moonspeak_hud_config_json,
        moonspeak_graph_initial_xml = moonspeak_graph_initial_xml,
    )

    with open("../resources/env/extravars", "w") as f:
        f.write(extravars_content)

    # set a few more variables and execute ansible_runner
    os.environ["ANSIBLE_NOCOLOR"] = "1"
    os.environ["ANSIBLE_NOCOWS"] = "1"

    r = ansible_runner.run(
        private_data_dir="../resources",
        playbook="services.yml",
        json_mode=False,         # well-known playbook output
        quiet=True,         # no stdout here in runner
    )

    print("{}: {}".format(r.status, r.rc))

    # return the playbook run output
    with open(r.stdout.name, "r") as f:
        print(f.read())

    return {"status": "ok"}
