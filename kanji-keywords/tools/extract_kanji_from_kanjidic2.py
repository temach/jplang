#!/usr/bin/env python3
#
# The abriged kanji dict xml tag hierarchy:
# <root>
#       <character>
#       <literal>
#       <misc>
#           <freq>
#           <jlpt>
#           <grade>
#       </misc>
#       </character>
# </root>
#
# <!ELEMENT misc (grade?, stroke_count+, variant*, freq?, rad_name*,jlpt?)>
# <!ELEMENT freq (#PCDATA)>
#       <!--
#       A frequency-of-use ranking. The 2,500 most-used characters have a
#       ranking; those characters that lack this field are not ranked. The
#       frequency is a number from 1 to 2,500 that expresses the relative
#       frequency of occurrence of a character in modern Japanese. This is
#       based on a survey in newspapers, so it is biassed towards kanji
#       used in newspaper articles. The discrimination between the less
#       frequently used kanji is not strong. (Actually there are 2,501
#       kanji ranked as there was a tie.)
#       -->
# <!ELEMENT jlpt (#PCDATA)>
#       <!--
#       The (former) Japanese Language Proficiency test level for this kanji.
#       Values range from 1 (most advanced) to 4 (most elementary). This field
#       does not appear for kanji that were not required for any JLPT level.
#       Note that the JLPT test levels changed in 2010, with a new 5-level
#       system (N1 to N5) being introduced. No official kanji lists are
#       available for the new levels. The new levels are regarded as
#       being similar to the old levels except that the old level 2 is
#       now divided between N2 and N3.
#       -->
# <!ELEMENT grade (#PCDATA)>
#       <!--
#       The kanji grade level. 1 through 6 indicates a Kyouiku kanji
#       and the grade in which the kanji is taught in Japanese schools.
#       8 indicates it is one of the remaining Jouyou Kanji to be learned
#       in junior high school. 9 indicates it is a Jinmeiyou (for use
#       in names) kanji which in addition  to the Jouyou kanji are approved
#       for use in family name registers and other official documents. 10
#       also indicates a Jinmeiyou kanji which is a variant of a
#       Jouyou kanji. [G]
#       -->

from lxml import etree
from collections import defaultdict
from pprint import pprint
import json

data = "../resources/kanjidic2.xml"

tree = etree.parse(data)
root = tree.getroot()

freq_kanji = defaultdict(lambda: 0)
jlpt_kanji = defaultdict(lambda: 0)
joyo_kanji = defaultdict(lambda: 0)

for character in tree.iter("character"):
    literal = character.xpath(".//literal")
    kanji = literal[0].text

    line = kanji + "="

    freq = character.xpath(".//freq")
    if freq != None and len(freq) > 0:
        freq_kanji[kanji] = int(freq[0].text)
        line += freq[0].text + "="

    jlpt = character.xpath(".//jlpt")
    if jlpt != None and len(jlpt) > 0 and int(jlpt[0].text) in (1, 2, 3, 4, 5):
        jlpt_kanji[kanji] = int(jlpt[0].text)
        line += jlpt[0].text

    grade = character.xpath(".//grade")
    if grade != None and len(grade) > 0 and int(grade[0].text) <= 8:
        joyo_kanji[kanji] = int(grade[0].text)
        line += grade[0].text + "="

    # print(line)


print("Frequent kanji {}".format(len(freq_kanji.keys())))
print("Old JLPT kanji {}".format(len(jlpt_kanji.keys())))
print("Joyo kanji {}".format(len(joyo_kanji.keys())))
print("\n\n")

# sort order is from easy/frequent kanji to most difficult/rare kanji

# 1 -> 2501
freq_ordered = {
    k: v for k, v in sorted(freq_kanji.items(), key=lambda item: item[1])
}

# 5 -> 1
jlpt_ordered = {
    k: v for k, v in sorted(jlpt_kanji.items(), key=lambda item: -1 * item[1])
}

# 1 -> 8
joyo_ordered = {
    k: v for k, v in sorted(joyo_kanji.items(), key=lambda item: item[1])
}

# pprint(freq_ordered.items()[:100])
# pprint("\n\n")
# pprint(jlpt_ordered.items()[:100])
# pprint("\n\n")
# pprint(joyo_ordered.items()[:100])
# pprint("\n\n")

with open("kanjidic2_frequent.json", "w", encoding="utf-8") as f:
    json.dump(freq_ordered, f, ensure_ascii=False, indent=2)

with open("kanjidic2_jlpt.json", "w", encoding="utf-8") as f:
    json.dump(jlpt_ordered, f, ensure_ascii=False, indent=2)

with open("kanjidic2_joyo.json", "w", encoding="utf-8") as f:
    json.dump(joyo_ordered, f, ensure_ascii=False, indent=2)
