#!/usr/bin/env python3

import json
from collections import defaultdict
import argparse
from pathlib import Path

parser = argparse.ArgumentParser(
    description="Parse file and make JSON array element from each line"
)

parser.add_argument('filepath', type=Path, help="path to input file")

args = parser.parse_args()

data = []

with open(args.filepath, encoding="utf-8") as f:
    for line in f:
        data.append(line.strip())

print(json.dumps(data, ensure_ascii=False, indent=2))
