
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

What letter combinations make the SH sound? Knowing this you can find unexpected
but meaningful patterns to use, e.g. letters "sch" make the SH sound.
# egrep '  SH' cmudict.dict | awk '{ print substr($1, 0, 3) }' | sort | uniq -c

What sound do the words that start with letter T normally make in english?
Knowing this helps decide which pattern to allocate to the most common sounds.
# egrep '^t' cmudict.dict | awk '{ print $2 " " substr($3, 1, 1) }' | sort | uniq -c