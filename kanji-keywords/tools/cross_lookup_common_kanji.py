#!/usr/bin/env python3
import json

# frequency analysis
SRC_NEWS = []

# acceptance filter and frequency
SRC_TWITTER = []
SRC_FREQ = []
SRC_NOZAKI = []

# acceptance filter
SRC_JLPT = []
SRC_JOYO = []

with open("../resources/frequency-scriptin-news.json") as ne:
    nedata = ne.read()
    nejson = json.loads(nedata)
    SRC_NEWS = [k[0] for k in nejson]
    print(SRC_NEWS[:50])

with open("../resources/frequency-scriptin-twitter.json") as t:
    tdata = t.read()
    tjson = json.loads(tdata)
    SRC_TWITTER = [k[0] for k in tjson]
    print(SRC_TWITTER[:50])

with open("../resources/frequency-nozaki-lab.json") as no:
    header = no.readline()
    for line in no:
        k = line.split()[1].strip()
        SRC_NOZAKI.append(k)
    print(SRC_NOZAKI[:50])

with open("../resources/frequency-kanjidict2-freq.json") as f:
    fdata = f.read()
    tjson = json.loads(fdata)
    SRC_FREQ = list(tjson.keys())
    print(SRC_FREQ[:50])

with open("../resources/frequency-kanjidict2-jlpt.json") as jl:
    jldata = jl.read()
    jljson = json.loads(jldata)
    SRC_JLPT = list(jljson.keys())
    print(SRC_JLPT[:50])

with open("../resources/frequency-kanjidict2-joyo.json") as jo:
    jodata = jo.read()
    jojson = json.loads(jodata)
    SRC_JOYO = list(jojson.keys())
    print(SRC_JOYO[:50])

newslookup = {k: i for i, k in enumerate(SRC_NEWS)}

# sanity check that we parsed wverything correctly
k = "一"
print(k in SRC_NEWS)
print(k in SRC_TWITTER)
print(k in SRC_FREQ)
print(k in SRC_NOZAKI)
print(k in SRC_JLPT)
print(k in SRC_JOYO)

# we want to avoid bullshit kanji
# see https://en.wikipedia.org/wiki/Jiong
for k, v in list(newslookup.items()):
    if (
        (k not in SRC_TWITTER)
        or (k not in SRC_FREQ)
        or (k not in SRC_NOZAKI)
        or (k not in SRC_JLPT)
        or (k not in SRC_JOYO)
    ):
        del newslookup[k]
        continue

    newslookup[k] += SRC_TWITTER.index(k)
    newslookup[k] += SRC_FREQ.index(k)
    newslookup[k] += SRC_NOZAKI.index(k)

ordered = {k: v for k, v in sorted(
    newslookup.items(), key=lambda item: item[1])}


firstfew = {}
i = 0
for k, v in ordered.items():
    firstfew[k] = v
    i += 1
    if i >= 1700:
        break

for k in SRC_JOYO:
    if k not in firstfew:
        print("possibly missing joyo kanji: {}".format(k))

kanji = json.dumps(firstfew, ensure_ascii=False, indent=2)
with open("kanji-by-freq.json", "w") as output:
    output.write(kanji)
