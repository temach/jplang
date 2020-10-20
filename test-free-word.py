import re
from pprint import pprint
import nltk
from nltk.stem.porter import PorterStemmer
stemmer = PorterStemmer()

new_mnemonic = """
Stop for a second or the egg will hatching in eights
"""

# the list of words we are allowed to use
#allwords_path = "google-10000-english.txt"

# lists of words that are currently reserved
# words used in anki deck (keywords and mnemonics)
ankiwords_path = "artem-kanji-deck-test-export.txt"

# separately load the list of onyomi
onyomiwords_path = "onyomi-mnemonics.txt"

# either we are checking if keyword is free
# or we are checking if mnemonic is free
word_regex = r'[A-Za-z0-9_]{2,}'

class TakenWord(object):
    def __init__(self, stem, metainfo):
        self.stem = stem
        self.context = metainfo

def main():
    with open(ankiwords_path, "r") as anki_file, open(onyomiwords_path, "r") as onyomi_file:
        anki_cards = anki_file.readlines()
        onyomi = onyomi_file.readlines()
        
        # learn words that are bad to use in mnemonics
        bad_mnemonics = []
        
        for line in anki_cards:
            kanji, keyword, mnemonic = line.split("\t")
            key_stem = stemmer.stem(keyword)
            taken = TakenWord(key_stem, "AnkiCard {}".format(line))
            bad_mnemonics.append(taken)
            
        for line in onyomi:
            on = line.split()[0]
            stem = stemmer.stem(on)
            taken = TakenWord(stem, "ONyomi   {}".format(line)) 
            bad_mnemonics.append(taken)
        
        # find if new mnemonic is bad
        nltk_tokens = nltk.word_tokenize(new_mnemonic)
        for word in nltk_tokens:
            stem = stemmer.stem(word)
            for taken in bad_mnemonics:
                if taken.stem == stem:
                    print("{:15} is matched with {}".format(word, taken.context))

if __name__ == "__main__":
    main()
