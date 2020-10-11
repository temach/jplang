# Keywords for kanji onyomi readings

Sources used to decide the most appropriate ONYOMI keywords are in `resources/` directory:
- cmudict.dict contains English phonetical transcriptions (http://www.speech.cs.cmu.edu/cgi-bin/cmudict)
- english-long-frequency.txt contains English words ordered by frequency of use, taken from subtitles (https://github.com/nachocab/words-by-frequency):

The resuling onyomi keywords in plain text format are in file:
- onyomi-keywords.txt

The results are also packaged as Anki deck in:
- resources/onyomi-keywords.apkg


### Guidelines for choosing onyomi keywords

- Try to use english words that are not in 10000 most common words (so normal words would not be mistaken for onyomi keywords)
- The combination of english letters OW in the onyomi keyword represent "ou" japanese sound. For example HOWling = hou
- The cobination of english letters UCK represent "yaku" japanese sound. For example BUCKweed = byaku and RUCKsack = ryaku
- Prolonged sounds are distinguished by longer words: KUmar = KU and KUbic-rubik = KUU

Some english letters remain unused, so they are repurposed as below:
- c -> K
- l -> R
- p -> unused
- q -> K
- v -> I
- x -> Z

For example onyomi keyword for KYO begins with letter "C" instead of "K".


### Additional notes

Vowels are not good to use at onyomi keyword's end.
Letters that can be part of a onyomi keyword can not be used to end a onyomi keyword.
For example using word "kits" for sound KI is bad, because it sounds like its for KITSU.

The sounds below can appear as second/third/fourth letters in ON yomi:
- チ or chi appears 14 times
- ク or ku appears 51 times
- キ or ki appears 13 times
- ウ or u appears 39 times
- ツ or tsu appears 41 times
- ン or n appears 63 times
- イ or i appears 31 times

Therefore these sounds should be avoided when they fall on the end of the onyomi keyword.

CMU dict sounds that are good to use at keyword's end (to mark that mnemonic part is finished):
```
B, D, DH, F, HH, L, M, OW, OY, P, R, S, SH, TH, V, W, Z, ZH 
```


Sounds that should NOT be used:
```
AA, AE, AH, AO, AW, AY, CH, EH, ER, EY, G, IH, IY, JH, K, N, NG, T, UH, UW, Y ,
```


Mapping of english pronunciation to ascii in the cmudict.dict file (also see http://www.speech.cs.cmu.edu/cgi-bin/cmudict):
```
AA	odd     	AA D
AE	at		AE T
AH	hut		HH AH T
AO	ought		AO T
AW	cow		K AW
AY	hide		HH AY D
B 	be		B IY
CH	cheese		CH IY Z
D 	dee		D IY
DH	thee		DH IY
EH	Ed		EH D
ER	hurt		HH ER T
EY	ate		EY T
F 	fee		F IY
G 	green		G R IY N
HH	he		HH IY
IH	it		IH T
IY	eat		IY T
JH	gee		JH IY
K 	key		K IY
L 	lee		L IY
M 	me		M IY
N 	knee		N IY
NG	ping		P IH NG
OW	oat		OW T
OY	toy		T OY
P 	pee		P IY
R 	read		R IY D
S 	sea		S IY
SH	she		SH IY
T 	tea		T IY
TH	theta		TH EY T AH
UH	hood		HH UH D
UW	two		T UW
V 	vee		V IY
W 	we		W IY
Y 	yield		Y IY L D
Z 	zee		Z IY
ZH	seizure		S IY ZH ER
```


### Practical commands for finding possible onyomi keywords in the dictionaries

Find words that start with sound J
```
# grep -P ' JH I.?.? (\w )?K' cmudict.dict 
```

Find words that begin with letters "ma"
```
# egrep -i '^ma' cmudict.dict 
```

Find words that begin with sound MA not followed by sounds T, N, K and print their phonetics in neat columns
```
# egrep -i '  M A.?.? [^tnk]' cmudict.dict  | column -t
```

Show onyomi keywords for onyomi that start with sound "^sh"
```
# egrep -i '^sh' onyomi-keywords.txt
# egrep -i '^sh' onyomi-keywords.txt | awk -F= '{print $1 " \t " $4}' | sort | column -t
```

Find a russian word that might sound good enough
```
# egrep -i '^коу' russian-words.txt
```

Find the frequency of the english word, try to avoid using any of the first 10000 words for onyomi keywords
```
# egrep -n -i '^bowling' english-long-frequency.txt 
```

What letter combinations make the SH sound? Knowing this you can find unexpected
but meaningful patterns to use, e.g. letters "sch" make the SH sound.
```
# egrep '  SH' cmudict.dict | awk '{ print substr($1, 0, 3) }' | sort | uniq -c
```

What sound do the words that start with letter T normally make in english?
Knowing this helps decide which pattern to allocate to the most common sounds.
```
# egrep '^t' cmudict.dict | awk '{ print $2 " " substr($3, 1, 1) }' | sort | uniq -c
```

# Kanji breakdown

Radical is kanji with no ONYOMI and no sub-kanji. Regarding the breakdown it dows not matter if the element is a kanji, a radical or a handmade drawing. So against common usage lets call everything just kanji.

There can be different ways to break kanji.

To find the best breakdown:
1. Find possible breakdowns
2. For each component in a breakdown find its possible appearances (as own kanji or sub-kanji in another kanji)
3. For each appearance find how frequently this separate identity is enforced, i.e. frequency of own kanji, frequency of kanji with this redical.
3. Sum up all the frequencies.
4. The breakdown with highest frequency wins. Its members most often appear as components/kanji.

For components breakdown and usage: https://thekanjimap.com/index.html
For frequency evaluation: http://scriptin.github.io/kanji-frequency/

Example investigation:
What is the best way to break up 勇 ? Is it (マ + 男) OR (甬 + 力)?
Maybe its best not to break it up at all, e.g. when the kanji appears much more often than its parts?


**Take the first possible breakdown (マ + 男)**

Investigate components:
- マ never appears on its own and in 甬 
- 男 appears on its own and in 虜 

Frequency evaluation:
- 甬 appears 9 times
- 男 appears 95900 times
- 虜 appears 995 times

In total components appear (9 + 95900 + 995) ~ 97000 times


**Take the second possible breakdown (甬 + 力)**

Investigate components:
- 甬 appears on its own and in 踊, 桶, 勇(current investigation), 痛, 通
- 力 appears on its own and in about 24 other kanji

Frequency evaluation:
- 甬 appears 9 times
- 踊 appears 8799 times
- 痛 appears 20230 times
- 通 appears 109080 times
- 力 appears 112027 times
- ....

In total components appear (9 + 8799 + 20230 + 109080 + 112027 + ...) ~ 240000 times


**Take third possible breakdown (no breakdown)**

Frequency evaluation:
- 勇 appears 12432 times


**Result**

Looking at frequency evaluations, the most commonly seen pattern is breakdown with (甬 + 力),
because its members get more apperances as kanji.


# Kanji keywords

Each kanji needs a keyword. 
- it should NOT be one of 10000 most common english words.
- it should NOT be one of the onyomi keywords.
- it should be unique for each kanji.
- it should reflect meaning of the kanji. 


