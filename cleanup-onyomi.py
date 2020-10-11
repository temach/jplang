import re

anki = []
with open("onyomi-plain-text.txt", "r", encoding="utf-8") as f:
    anki = f.readlines()


better_anki = []
for line in anki:
    front = line.split("\t")[0].strip()
    front = front.replace("<br>", "").strip()
    front = front.replace("<k>", "").strip()
    front = front.replace("</k>", "").strip()
    m = re.search(r'[A-Z]+', front)
    capitals = m.group(0)
    front = front.replace(capitals, "<k>{}</k>".format(capitals))

    back = line.split("\t")[1].strip()
    back = back.replace("<br>", "").strip()
    better_line = "{}\t{}\t".format(front, back)
    better_anki.append(better_line)
    print(better_line)
