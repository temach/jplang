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
