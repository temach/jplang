anki = []
with open("onyomi-plain-text.txt", "r", encoding="utf-8") as f:
    anki = f.readlines()

text = []
with open("freq-mnemonics.txt", "r", encoding="utf-8") as f:
    text = f.readlines()

found = {}

for line in text:
    print(line)
    sound = line.split("=")[3].strip()
    keyword = line.split("=")[4].strip()
    if "/" in keyword:
        keyword = keyword.split("/")[0].strip()
    found[sound] = [keyword]

for line in anki:
    print(line)
    sound = line.split("\t")[1].split("=")[3].strip()
    keyword = line.split("\t")[1].split("=")[4].strip()
    if "<br>" in keyword:
        keyword = keyword.replace("<br>", "").strip()

    if sound not in found:
        print("unknown sound!!! {}".format(line))
        break
    else:
        found[sound].append(keyword)

for k,v in sorted( found.items(), key=lambda x: x[0]):
    if len(v) > 2:
        print("DUPLICATES: {}".format(v))
        continue
    if len(v) != 2:
        print("sounds did not match {}".format(v))
        continue
    if v[0] != v[1]:
        print("{:10} needs resolution: {}".format(k, v))
