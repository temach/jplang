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
B, D, DH, F, HH, L, M, OW, OY, P, R, S, SH, TH, V, W, Z, ZH 

Sounds that should NOT be used:
AA, AE, AH, AO, AW, AY, CH, EH, ER, EY, G, IH, IY, JH, K, N, NG, T, UH, UW, Y ,

CMU dictionary mapping of sound to ascii:
http://www.speech.cs.cmu.edu/cgi-bin/cmudict

Sound mapping in the cmudict.dict file:
```
AA	odd     AA D
AE	at		AE T
AH	hut		HH AH T
AO	ought	AO T
AW	cow		K AW
AY	hide	HH AY D
B 	be		B IY
CH	cheese	CH IY Z
D 	dee		D IY
DH	thee	DH IY
EH	Ed		EH D
ER	hurt	HH ER T
EY	ate		EY T
F 	fee		F IY
G 	green	G R IY N
HH	he		HH IY
IH	it		IH T
IY	eat		IY T
JH	gee		JH IY
K 	key		K IY
L 	lee		L IY
M 	me		M IY
N 	knee	N IY
NG	ping	P IH NG
OW	oat		OW T
OY	toy		T OY
P 	pee		P IY
R 	read	R IY D
S 	sea		S IY
SH	she		SH IY
T 	tea		T IY
TH	theta	TH EY T AH
UH	hood	HH UH D
UW	two		T UW
V 	vee		V IY
W 	we		W IY
Y 	yield	Y IY L D
Z 	zee		Z IY
ZH	seizure	S IY ZH ER
```


### Practical commands for finding possible onyomi keywords in the dictionaries

```
# grep -P ' JH I.?.? (\w )?K' cmudict.dict 
# egrep -i '^meets' cmudict.dict 
# egrep -i '  M A.?.? [^tnk]' cmudict.dict  | column -t

# egrep -i '^j' onyomi-keywords.txt 
# egrep -i '^sh' onyomi-keywords.txt | awk -F= '{print $1 " \t " $4}' | sort | column -t

# egrep -i '^коу' russian-words.txt

# egrep -n -i  ^bow english-long-frequency.txt 
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

