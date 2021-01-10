# Onyomi keywords

For project overview read the readme in root project directory.

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


### Tools 

- Python script to extract and rank onyomi of the common kanji (kanji that are marked as "frequent" in kanjidic2.xml)
- Markdown file with snippets showing how to grep dictionary files looking for good keywords keeping in mind spelling, pronunciation and frequency of use.
- Python scripts to help build the anki deck.

