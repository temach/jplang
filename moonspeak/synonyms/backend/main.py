#!/usr/bin/env python3
import json
import re
import urllib
import os
from pathlib import Path
from collections import defaultdict

import gunicorn.app.base
import gunicorn.config

import werkzeug
from flask import Flask, send_from_directory, make_response, request, redirect  # type: ignore
from typing import TypedDict, Any


class GunicornApp(gunicorn.app.base.Application):

    def __init__(self, app, options=None):
        self.options = options or {}
        self.application = app
        super().__init__()

    def init(self, parser, opts, args):
        # config = {key: value for key, value in self.options.items()
        #     if key in self.cfg.settings and value is not None}
        # for key, value in config.items():
        #     self.cfg.set(key.lower(), value)
        # return self.option
        return None

    def load(self):
        return self.application

    # Override the default load_config function from gunicorn because it
    # tries to do parse_args and that is breaking our parse_args
    # instead we use parse_known_args here
    def load_config(self):
        # parse console args
        parser = self.cfg.parser()
        args, argv = parser.parse_known_args()
        if argv:
            print('unrecognized arguments: {}'.format(argv))

        # optional settings from apps
        cfg = self.init(parser, args, args.args)

        # set up import paths and follow symlinks
        self.chdir()

        # Load up the any app specific configuration
        if cfg:
            for k, v in cfg.items():
                self.cfg.set(k.lower(), v)

        env_args = parser.parse_args(self.cfg.get_cmd_args_from_env())

        if args.config:
            self.load_config_from_file(args.config)
        elif env_args.config:
            self.load_config_from_file(env_args.config)
        else:
            default_config = gunicorn.config.get_default_config_file()
            if default_config is not None:
                self.load_config_from_file(default_config)

        # Load up environment configuration
        for k, v in vars(env_args).items():
            if v is None:
                continue
            if k == "args":
                continue
            self.cfg.set(k.lower(), v)

        # Lastly, update the configuration with any command line settings.
        for k, v in vars(args).items():
            if v is None:
                continue
            if k == "args":
                continue
            self.cfg.set(k.lower(), v)

        # current directory might be changed by the config now
        # set up import paths and follow symlinks
        self.chdir()


class KeyCandidate(TypedDict):
    word: str
    metadata: str
    freq: list[int]


ListKeyCandidate = list[KeyCandidate]
Thesaurus = dict[str, list[str]]
app = Flask(__name__, static_folder=None)
app.config['DEV_MODE'] = len(os.getenv("MOONSPEAK_DEV_MODE", "")) > 1


def get_en_freq(word):
    return [
        CORPUS.get(word, -1),
        SUBS.get(word, -1)
    ]


@app.get("/<lang>/api/synonyms/<word>")
def synonyms(lang, word):
    res = inner_synonyms(word)
    response = make_response(json.dumps(res), 200, {"Content-Type": "application/json"})
    return response


def inner_synonyms(word) -> ListKeyCandidate:
    # usefull thesaurus sources: https://github.com/Ron89/thesaurus_query.vim

    # Big Huge Thesaurus:
    # https://github.com/tttthomasssss/PyHugeThesaurusConnector
    # Key:
    # 56d5758eb85511ea73b9ab65436761c2
    # e.g: https://words.bighugelabs.com/api/2/56d5758eb85511ea73b9ab65436761c2/word/json

    # Maryam webster keys:
    # https://github.com/PederHA/mwthesaurus
    # Key (Thesaurus):
    # fb5b269d-867b-4401-85a0-777436d9c033
    # Key (Intermediate Thesaurus):
    # 72e1d7bf-09a3-43ef-9dae-17989dc6d355

    # return json.dumps([{"word": "artem", "metadata": "artem", "freq": (10, 10)}])

    word = word.lower()
    result = {}
    popularity: dict[str, int] = defaultdict(int)

    for thesaurus in [MOBY, OPENOFFICE, WORDNET]:
        for w in thesaurus.get(word, []):
            # check that word is not obscure, it should be present in both google and subs corpus
            freq = get_en_freq(w)
            if (freq[0] < 0 and freq[1] < 0):
                continue
            # build the item
            item: KeyCandidate = {
                "word": w,
                "freq": freq,
                "metadata": ""
            }
            # save the item
            result[w] = item
            # everytime the word appears in a different thesaurus, increase its popularity
            popularity[w] += 1

    for w in result.keys():
        result[w]["metadata"] = str(popularity[w])

    # sort according to popularity
    ordered = sorted(
        result.values(),
        key=lambda item: int(item["metadata"]),
        reverse=True
    )

    return ordered


@app.get("/")
def get_index():
    # must redirect to language sub-url otherwise relative links break
    host_url = urllib.parse.urlparse(request.host_url)
    domain = host_url.hostname.split(".")[-1]
    return redirect(f"/{domain}/", code=307)


@app.get("/<path:filename>")
def get_static(filename):
    root = Path("../frontend/src/")
    p = root / filename

    # if just a dir name, try returning index.html
    if p.is_dir():
        p = p / "index.html"

    # try:
    # in prod this works without extra checks
    return send_from_directory(root, p.relative_to(root))
    # except werkzeug.exceptions.NotFound:
    #     if app.config["DEV_MODE"]:
    #         return redirect(f"/index.html", code=307)
    #     else:
    #         return make_response("", 404)

    # if p.exists():
    #     return send_from_directory(root, p.relative_to(root))

    # # if file does not exist and we are in dev mode
    # # blindly try to send proxy, expecing that ".toml" version exists
    # toml = p.parent / (p.name + '.toml')
    # if toml.exists():
    #     proxy_file = "proxy.html" if ".html" in p.suffixes else "proxy.js" 
    #     proxy = root / "static" / "dev_mode" / proxy_file
    #     return send_from_directory(root, proxy.relative_to(root))

    # static = root / "static" / p.name
    # if static.exists():
    #     return send_from_directory(root, static.relative_to(root))

    # return send_from_directory("", "")


if __name__ == "__main__":
    # english frequency
    CORPUS = {}
    SUBS = {}
    # thesaurus
    WORDNET: Thesaurus = {}
    MOBY: Thesaurus = {}
    OPENOFFICE: Thesaurus = {}

    with open("../resources/english-from-gogle-corpus-by-freq.txt") as f:
        for number, line in enumerate(f, start=1):
            word = line.split()[0].strip()
            CORPUS[word] = number

    with open("../resources/english-from-subtitles-by-freq.txt") as f:
        for number, line in enumerate(f, start=1):
            word = line.split()[0].strip()
            SUBS[word] = number

    with open("../resources/english-thesaurus-moby-mthesaur.txt") as f:
        for line in f:
            line = line.lower()
            key = line.split(',')[0]
            synonyms = line.split(',')[1:]
            MOBY[key] = synonyms

    with open("../resources/english-thesaurus-openoffice.txt") as f:
        lines = f.readlines()
        i = 1
        while i < len(lines):
            line = lines[i].lower()
            key, n_meanings = line.split('|')
            meanings = set()
            for k in range(int(n_meanings)):
                l = lines[i + k].lower()
                meaning_line = l.split('|')[1:]
                meanings.update(meaning_line)
            OPENOFFICE[key] = list(meanings)
            i += 1 + int(n_meanings)

    with open("../resources/english-thesaurus-wordnet.jsonl") as f:
        for line in f:
            data = json.loads(line)
            key = data["word"].lower()
            synonyms = data["synonyms"]
            if key in WORDNET:
                WORDNET[key].extend(synonyms)
            else:
                WORDNET[key] = synonyms

    GunicornApp(app).run()
