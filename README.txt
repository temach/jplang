
English phonetical transcriptions:
- cmudict.dict
- English-phonetic-transcription.txt

English words ordered by frequency of use, taken from subtitles (https://github.com/nachocab/words-by-frequency):
- english-long-frequency.txt

Example mnemonics derived from above:
- freq-mnemonics.txt


CMU dictionary mapping of sound to ascii:
http://www.speech.cs.cmu.edu/cgi-bin/cmudict

How to find mnemonics, inspirational commands:

# grep -P ' JH I.?.? (\w )?K' cmudict.dict 
# egrep -i '^meets' cmudict.dict 
# egrep -i '  M A.?.? [^tnk]' cmudict.dict  | column -t

# egrep -i '= j' freq-mnemonics.txt 
# egrep -i '= t' freq-mnemonics.txt | awk -F= '{print $4 " \t " $5}' | sort | column -t

# egrep -i '^коу' russian-words.txt

# egrep -n -i  ^bow english-long-frequency.txt 
