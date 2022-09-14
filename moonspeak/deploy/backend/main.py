#!/usr/bin/env python3

# see: https://jpmens.net/2020/02/28/dial-a-for-ansible-and-r-for-runner/

import os
import logging
import pathlib
import json
import secrets
import threading

import ansible_runner
from jinja2 import Environment, FileSystemLoader, select_autoescape
from bottle import route, run, get, request, HTTPResponse
from lxml import etree as xml

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


DOMAIN = os.getenv("MOONSPEAK_DOMAIN", "moonspeak.test")
DEPLOY_SECRET = os.getenv("MOONSPEAK_DEPLOY_SECRET", "secret")


# load templates
JINJA_ENV = Environment(
    loader=FileSystemLoader(pathlib.Path("../resources/templates")),
    autoescape=select_autoescape()
)
HUD_TEMPLATE = JINJA_ENV.get_template("moonspeak_hud_config.json")
GRAPH_TEMPLATE = JINJA_ENV.get_template("moonspeak_graph_initial.xml")
EXTRAVARS_TEMPLATE = JINJA_ENV.get_template("extravars")


def guid(nbytes=10):
    return secrets.token_hex(nbytes)

def submit_deployment_task(unique_id, node):
    # generate service names
    moonspeak_hud_service = "hud-{}-{}".format(unique_id, guid())
    moonspeak_graph_service = "graph-{}-{}".format(unique_id, guid())
    moonspeak_submit_service = "submit-{}-{}".format(unique_id, guid())
    moonspeak_workelements_service = "workelements-{}-{}".format(unique_id, guid())

    # render templates into strings and then try to make valid objects 
    # this is to protect against bad characters, XSS, injections
    json_string = HUD_TEMPLATE.render(
        moonspeak_domain = DOMAIN,
        moonspeak_graph_service = moonspeak_graph_service,
        moonspeak_node = node,
    )
    moonspeak_hud_config_json = json.loads(json_string)
 
    xml_string = GRAPH_TEMPLATE.render(
        moonspeak_node = node,
        moonspeak_domain = DOMAIN,
        moonspeak_hud_service = moonspeak_hud_service,
        moonspeak_graph_service = moonspeak_graph_service,
        moonspeak_submit_service = moonspeak_submit_service,
        moonspeak_workelements_service = moonspeak_workelements_service,
    )
    moonspeak_graph_initial_xml = xml.XML(xml_string, parser=xml.XMLParser(remove_blank_text=True))

    # this will be supplied to ansible
    extravars_string = EXTRAVARS_TEMPLATE.render(
        moonspeak_domain = DOMAIN,
        moonspeak_hud_service = moonspeak_hud_service,
        moonspeak_graph_service = moonspeak_graph_service,
        moonspeak_submit_service = moonspeak_submit_service,
        moonspeak_workelements_service = moonspeak_workelements_service,
        moonspeak_hud_config_json = json.dumps(moonspeak_hud_config_json, separators=(',', ':')),
        moonspeak_graph_initial_xml = xml.tostring(moonspeak_graph_initial_xml, encoding="unicode", method="xml"),
    )

    logger.debug(extravars_string)

    with open("../resources/env/extravars", "w") as f:
        f.write(extravars_string)

    # configure ansible_runner: https://ansible-runner.readthedocs.io/en/latest/intro/#runner-input-directory-hierarchy
    runner_thread, r = ansible_runner.run_async(
        private_data_dir="../resources",
        playbook="services.yml",
        host_pattern=node,
        ident=moonspeak_hud_service,
        rotate_artifacts=50,
        # pass cancel_callback because of bug in ansible runner: https://github.com/ansible/ansible-runner/issues/1075
        cancel_callback=lambda: None,
    )

    user_unique_url = "http://{}/router/{}/{}".format(DOMAIN, node, moonspeak_hud_service)
    return user_unique_url

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

@route("/<deploy_secret>/new", method=["GET"])
def deploy(deploy_secret):
    if not secrets.compare_digest(deploy_secret, DEPLOY_SECRET):
        return HTTPResponse(status=401)

    # select the node on which to deploy
    node = "localhost"

    # generate unique id
    unique_id = guid(6)

    # ask to spin up personal containers for this user 
    user_unique_url = submit_deployment_task(unique_id, node)

    # return the url of root service 
    return {
        "user_unique_url": user_unique_url,
    }

@route("/<deploy_secret>/status", method=["GET"])
def status(deploy_secret):
    if not secrets.compare_digest(deploy_secret, DEPLOY_SECRET):
        return HTTPResponse(status=401)

    return {
        "threads": [str(t) for t in threading.enumerate()]
    }


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Run as "python main.py"')
    parser.add_argument('--port', type=int, default=80, help='port number')
    args = parser.parse_args()

    logger.debug("Running server on port {}".format(args.port))
    run(host="0.0.0.0", port=args.port, debug=True)
