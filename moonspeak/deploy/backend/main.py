#!/usr/bin/env python3

# see: https://jpmens.net/2020/02/28/dial-a-for-ansible-and-r-for-runner/

import os
import logging
import socket
from uuid import uuid4
import pathlib
import json
from lxml import etree as xml
import secrets

import ansible_runner
from jinja2 import Environment, FileSystemLoader, select_autoescape
from bottle import route, run, get, request, HTTPResponse

logger = logging.getLogger(__name__)
logger.setLevel(logging.WARN)

DOMAIN = os.getenv("MOONSPEAK_DOMAIN", "moonspeak.test")
NODE = os.getenv("MOONSPEAK_NODE", "testnode")

# this must be supplied, 
# if not supplied we generate random number which will block any attempts to deploy :)
SECRET = os.getenv("MOONSPEAK_DEPLOY_SECRET", secrets.token_urlsafe())

def guid():
    return secrets.token_urlsafe()

@route("/new/<deploy_secret>/<unique_id>", method=["GET"])
def login(deploy_secret, unique_id):
    if not secrets.compare_digest(deploy_secret, SECRET):
        return HTTPResponse(status=401)

    # load templates
    jinja_env = Environment(
        loader=FileSystemLoader(pathlib.Path("../resources/templates")),
        autoescape=select_autoescape()
    )

    # generate service names
    moonspeak_hud_service = "hud-{}-{}".format(unique_id, guid())
    moonspeak_graph_service = "graph-{}-{}".format(unique_id, guid())
    moonspeak_submit_service = "submit-{}-{}".format(unique_id, guid())
    moonspeak_workelements_service = "workelements-{}-{}".format(unique_id, guid())

    # render templates into meaningful objects 
    hud_template = jinja_env.get_template("moonspeak_hud_config.json")
    json_string = hud_template.render(
        moonspeak_domain = DOMAIN,
        moonspeak_graph_service = moonspeak_graph_service,
        moonspeak_node = NODE,
    )
    moonspeak_hud_config_json = json.loads(json_string)
 
    graph_template = jinja_env.get_template("moonspeak_graph_initial.xml")
    xml_string = graph_template.render(
        moonspeak_node = NODE,
        moonspeak_domain = DOMAIN,
        moonspeak_hud_service = moonspeak_hud_service,
        moonspeak_graph_service = moonspeak_graph_service,
        moonspeak_submit_service = moonspeak_submit_service,
        moonspeak_workelements_service = moonspeak_workelements_service,
    )
    moonspeak_graph_initial_xml = xml.XML(xml_string, parser=xml.XMLParser(remove_blank_text=True))

    # this will be supplied to ansible
    extravars_template = jinja_env.get_template("extravars")
    extravars_string = extravars_template.render(
        moonspeak_domain = DOMAIN,
        moonspeak_hud_service = moonspeak_hud_service,
        moonspeak_graph_service = moonspeak_graph_service,
        moonspeak_submit_service = moonspeak_submit_service,
        moonspeak_workelements_service = moonspeak_workelements_service,
        moonspeak_hud_config_json = json.dumps(moonspeak_hud_config_json, separators=(',', ':')),
        moonspeak_graph_initial_xml = xml.tostring(moonspeak_graph_initial_xml, encoding="unicode", method="xml"),
    )

    logger.info(extravars_string)

    with open("../resources/env/extravars", "w") as f:
        f.write(extravars_string)

    # configure ansible_runner: https://ansible-runner.readthedocs.io/en/latest/intro/#runner-input-directory-hierarchy
    runner_thread, r = ansible_runner.run_async(
        private_data_dir="../resources",
        playbook="services.yml",
    )

    user_unique_url = "/router/{}/{}".format(NODE, moonspeak_hud_service)
    return {
        "url": user_unique_url,
    }

    # if r.rc == 0:
    #     with open(r.stdout.name, "r") as f:
    #         logger.info(f.read())
    # else:
    #     with open(r.stdout.name, "r") as f:
    #         logger.error(f.read())
    #     with open(r.stderr.name, "r") as f:
    #         logger.error(f.read())

    # return {
    #     "statusline": "{}: {}".format(r.status, r.rc)
    # }


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Run as "python main.py"')
    parser.add_argument('--port', type=int, default=80, help='port number')
    args = parser.parse_args()

    logger.info("Running server on port {}".format(args.port))
    run(host="0.0.0.0", port=args.port, debug=True)
