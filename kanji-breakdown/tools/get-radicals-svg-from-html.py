import os
from lxml import etree
from bs4 import BeautifulSoup
import json

kanji_json = "../resources/kanji.json"
html_path = "../resources/radicals-svg.html"
json_path = "../resources/radicals.json"

with open(kanji_json, "r") as fkanji:
    kanji = json.load(fkanji)

radicals = {}
count = 0
with open(html_path, "r") as f:
    soup =  BeautifulSoup(f.read())
    svgs = soup.find_all('svg')
    for svg in svgs:
        del svg.attrs["class"]
        count += 1
        text = str(svg).strip().replace("\n", "")
        item = {
            "keyword": "radical{}".format(count),
            "kanji": "",
            "unicode": "",
            "note": "",
            "svg": text,
        }
        radicals[item["keyword"]] = item


with open(json_path, "w") as outf:
    json.dump(radicals, outf)
