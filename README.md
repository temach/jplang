# Onyomi keywords

The files related to onyomi-keywords reside inside "onyomi-keywords/" directory.

The onyomi keywords in plain text format are in file:
- onyomi-keywords.txt

The results are also packaged as Anki deck in "results/" directory.


### Useful resources

Sources used to decide the most appropriate ONYOMI keywords are in `resources/` directory:
- cmudict.dict contains English phonetical transcriptions (http://www.speech.cs.cmu.edu/cgi-bin/cmudict)
- english-long-frequency.txt contains English words ordered by frequency of use, taken from subtitles (https://github.com/nachocab/words-by-frequency):
- google-english-corpus.txt contains 1/3 of a million words from google english corpus ordered by frequency of use (https://norvig.com/ngrams/count_1w.txt) 
- kanjidic2.xml is a kanji dictionary with frequency counts and all onyomi for each kanji (http://www.edrdg.org/wiki/index.php/KANJIDIC_Project)


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


# Kanji keywords

Each kanji needs a keyword. 
- it should NOT be one of 10000 most common english words.
- it should NOT be one of the onyomi keywords.
- it should be unique for each kanji.
- it should reflect meaning of the kanji. 

Most common english words can be taken from 1/3 million of google english corpus (https://norvig.com/ngrams/count_1w.txt)

Previous works:
- kanji keywords scriptin github (https://github.com/scriptin/kanji-keys)

### Useful resources

To find names for kanji that are just made up junk consider using a drawing-to-keyword mapping software:
- Draw and get accociated words: https://github.com/engelsjk/web-demo-quickdraw-visualizer
- Using QuickDraw and AutoDraw API together: https://github.com/engelsjk/python-test-googledraw-api
- Angular app that words against google quick draw API: https://github.com/Jdruwe/drawing-recognition/blob/1d7f57a5ca5fa63b4f53ed50bae03c289ffb563a/src/app/guess/guess.component.ts#L42
- The dataset behind quick draw: https://github.com/googlecreativelab/quickdraw-dataset#the-raw-moderated-dataset


# Kanji breakdown

Radical is kanji with no ONYOMI and no sub-kanji.
Regarding the breakdown it dows not matter if the element is a kanji, a radical or a handmade drawing.
So against common usage lets call everything just kanji.

Extremely useful:
- KanjiBreak by fasiha (https://fasiha.github.io/post/kanjibreak/)

### Useful resources

Previous works on kanji breakdown:
- List-of-200-radicals-used-in-Hanyu-Da-Cidian.pdf breakdown for chinese characters
- kradfile-u this is like kradfile but improved breakdowns and done in unicode!


### Methodology

There can be different ways to break kanji.

To find the best breakdown:
1. Find possible breakdowns
2. For each component in a breakdown find its possible appearances (as own kanji or sub-kanji in another kanji)
3. For each appearance find how frequently this separate identity is enforced, i.e. frequency of own kanji, frequency of kanji with this redical.
3. Sum up all the frequencies.
4. The breakdown with highest frequency wins. Its members most often appear as components/kanji.

Useful links:
- components breakdown and usage: https://thekanjimap.com/index.html
- frequency evaluation: http://scriptin.github.io/kanji-frequency/
- google quick draw for character recognition: https://www.chenyuho.com/project/handwritingjs/

**Example investigation**

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
