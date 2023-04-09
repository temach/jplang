
# Developers

## Running locally

```
# cd backend
# pip install -r requirements.txt
# python main.py
```
Will run by default on port 8040

To run on specific port use:
```
# python main.py --bind=127.0.0.1:8040
```

From time to time you might want to update nltk_data in the ./resources/nltk_data/ dir, for that just run the ./backend/download_libs.py script.

# Kanji Keywords

For overview and results see the readme in the rood project directory.

Assign unique keyword to each kanji. The results are in kanji-keywords.db (sqlite database).


Note about Joyo kanji: http://www.guidetojapanese.org/blog/2008/08/14/the-new-joyo-kanj-and-why-we-shouldnt-give-a-damn/

Japanese kanji encoding difficulty: https://namakajiri.net/nikki/joyo-kanji-variants-the-curious-case-of-and-%e5%8f%b1/

List of joyo and jinmei kanji (government last updated joyo kanji in 2010): http://nihongo.monash.edu/jouyoukanji.html
jinmeiyo kanji = kanji used in people's names

There is no official list of JLPT kanji: https://jlpt.jp/e/faq/
'''
Why is "Test Content Specifications" no longer available after the 2010 revision of the JLPT?

We believe that the ultimate goal of studying Japanese is to use the language to communicate rather than simply memorizing vocabulary, kanji and grammar items. Based on this idea, the JLPT measures "language knowledge such as characters, vocabulary and grammar" as well as "competence to perform communicative tasks by using the language knowledge." Therefore, we decided that publishing "Test Content Specifications" containing a list of vocabulary, kanji and grammar items was not necessarily appropriate.

'''


news.json and twitter.json from scriptin github: https://github.com/scriptin/kanji-frequency
Its nowadays best not to use Aozora Bunpou because its old and kanji and words are old. That stuff is not even UTF-8.

Some kanji from twitter are not worth learning, i.e. obscure kanji used just for emoji not for its meaning:
- explanation https://en.wikipedia.org/wiki/Jiong
- unicode code point 56e7 http://www.unicode.org/cgi-bin/GetUnihanData.pl?codepoint=56e7

The joyo and jlpt lists are taken from kanjidict2 project.


Another issue is how to keep the onyomi in sync. The keywords rely on onyomi data and that might keep changing.
Currently onyomi are read from a text file on startup. How to update this file with latest version from anki-web?

Install anki (just to use its library)
connect to anki-web
sync your collection (maybe just the deck "onyomi" from your collection)
export the deck into text file
restart kanji-keywords to re-read the onyomi text file
