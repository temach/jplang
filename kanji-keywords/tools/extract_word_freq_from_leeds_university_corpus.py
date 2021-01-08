#!/usr/bin/env python3
#
# The text file from http://corpus.leeds.ac.uk/frqc/internet-jp.num
#
# 1 41309.50 の
# 2 23509.54 に
# 3 22216.80 は
# 4 20431.93 て
# 5 20326.59 を
#

from lxml import etree
from collections import defaultdict
from pprint import pprint
import json
import pdb

data = "../resources/internet-jp.num"

wordfreq = []

with open(data, "r", encoding="utf-8") as f:
    for line in f:
        try:
            _, _, word = line.split()
        except ValueError:
            # ignore non-compliant lines
            print(line.split())
            continue
        wordfreq.append(word.strip())

with open("japanese-wordfreq-leeds-uni.json", "w", encoding="utf-8") as f:
    json.dump(wordfreq, f, ensure_ascii=False, indent=2)
