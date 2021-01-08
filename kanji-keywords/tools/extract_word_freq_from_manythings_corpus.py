#!/usr/bin/env python3
#
# The html hierarchy from https://www.manythings.org/japanese/words/leeds/
# after removing html headers and footers
#
# <li>
#    <a href="search?query=の&from=jpn&to=eng">[T]</a> -
#    <a href="http://www.csse.monash.edu.au/~jwb/cgi-bin/wwwjdic.cgi?1MUQの">[E]</a> -
#    <b>の</b> - 41309.50
# </li>
#

from lxml import etree
from collections import defaultdict
from pprint import pprint
import json
import pdb

data = "../resources/words.html"

wordfreq = []
parser = etree.XMLParser(recover=True)

with open(data, "r", encoding="utf-8") as f:
    for line in f:
        line.replace("&", "")
        elem = etree.fromstring(line, parser)
        word = elem.findall("b")[0]
        wordfreq.append(word.text)

with open("japanese-wordfreq-manythings.json", "w", encoding="utf-8") as f:
    json.dump(wordfreq, f, ensure_ascii=False, indent=2)
