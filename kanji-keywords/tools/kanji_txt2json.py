#!/usr/bin/env python3

import json
from collections import defaultdict
import argparse
from pathlib import Path

parser = argparse.ArgumentParser(
    description="Parse file (ignoring ASCII) and output kanji with its number of occurrences in JSON format"
)

parser.add_argument('filepath', type=Path, help="path to input file")

args = parser.parse_args()

kanji = defaultdict(lambda: 0)
with open(args.filepath, encoding="utf-8") as f:
    for line in f:
        for char in line:
            if not char.isascii():
                kanji[char] += 1

kanji_ordered = {
    k: v for k, v in sorted(kanji.items(), key=lambda item: item[1])
}
print(json.dumps(kanji_ordered, ensure_ascii=False, indent=2))
