#!/usr/bin/env python3
#
# The html hierarchy from https://en.wiktionary.org/wiki/Wiktionary:Frequency_lists/Japanese
# after removing html headers and footers
#
# <li>
#     <span class="Jpan" lang="ja">
#     <a href="/wiki/%E3%81%AE#Japanese" title="の">の</a>
#     </span>
# </li>
#

from lxml import etree
from collections import defaultdict
from pprint import pprint
import json
import pdb

data = "../resources/Japanese.html"

wordfreq = []
parser = etree.XMLParser(recover=True)


with open(data, "r", encoding="utf-8") as f:
    for line in f:
        line.replace("&", "")
        elem = etree.fromstring(line, parser)
        try:
            word = elem.xpath("//a")[0]
        except IndexError:
            # some html is malformed, just ignore it
            print(line)
            continue
        wordfreq.append(word.text)

with open("japanese-wordfreq-wiktionary.json", "w", encoding="utf-8") as f:
    json.dump(wordfreq, f, ensure_ascii=False, indent=2)
