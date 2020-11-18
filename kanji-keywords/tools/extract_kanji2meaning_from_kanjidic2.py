#!/usr/bin/env python3
#
# The abriged kanji dict xml tag hierarchy:
# <root>
#       <character>
#       <literal>
#       <reading_meaning>
#           <rmgroup>
#               <meaning #1/>
#               <meaning #2/>
#               <meaning #3/>
#           </rmgroup>
#       </reading_meaning>
#       </character>
# </root>
#
#
# <!ELEMENT reading_meaning (rmgroup*, nanori*)>
#       <!--
#       The readings for the kanji in several languages, and the meanings, also
#       in several languages. The readings and meanings are grouped to enable
#       the handling of the situation where the meaning is differentiated by
#       reading. [T1]
#       -->
# <!ELEMENT rmgroup (reading*, meaning*)>
# <!ELEMENT meaning (#PCDATA)>
#       <!--
#       The meaning associated with the kanji.
#       -->
#

from lxml import etree
from collections import defaultdict
from pprint import pprint
import json

data = "../resources/kanjidic2.xml"

tree = etree.parse(data)
root = tree.getroot()

kanji2meaning = {}

for character in tree.iter("character"):
    literal = character.xpath(".//literal")
    kanji = literal[0].text
    meanings = character.xpath(".//meaning[not(@*)]")
    kanji2meaning[kanji] = [m.text for m in meanings]

pprint(list(kanji2meaning.items())[:50])

with open("keywords-kanjidic2-meanings.json", "w", encoding="utf-8") as f:
    json.dump(kanji2meaning, f, ensure_ascii=False, indent=2)
