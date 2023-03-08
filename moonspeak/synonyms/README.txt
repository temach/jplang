
# Developers

## Running locally

```
# cd backend
# pip install -r requirements.txt
# python main.py
```
Will run by default on port 8043.


To run on specific port use:
```
# python main.py --bind=127.0.0.1:8043
```

Gunicorn will automatically pick up other settings from its config file and run the application.


# There are a number of thesauruses we use.

## Russian

Overall a nice list of thesauruses can be found here:
- https://nlpub.ru/Ресурсы#Тезаурус (aka https://nlpub.ru/%D0%A0%D0%B5%D1%81%D1%83%D1%80%D1%81%D1%8B#%D0%A2%D0%B5%D0%B7%D0%B0%D1%83%D1%80%D1%83%D1%81 )
- https://russe.nlpub.org/downloads/

From that list:
- YARN final end-of-life release: https://github.com/russianwordnet/yarn/releases
- Словарь Абрамова as used in Open Office: https://nlpub.ru/Словарь_Абрамова (aka https://extensions.openoffice.org/en/project/slovari-dlya-russkogo-yazyka-dictionaries-russian )
- Parsed russian wiktionary from 2019: http://whinger.krc.karelia.ru/soft/wikokit/index.html aka https://github.com/componavt/wikokit aka https://arxiv.org/pdf/1011.1368.pdf

Maybe use later:
- Thesaurus of slavic word assocciations: http://it-claim.ru/Projects/ASIS/SAS/SAS_pdf/SAS.pdf
- https://nlpub.ru/RTLOD aka https://github.com/nlpub/rtlod
- https://github.com/nlpub/rdt aka https://nlpub.ru/Russian_Distributional_Thesaurus

Other thesauruses:
- Discontinued, not really a free lisence: http://www.labinform.ru/pub/ruthes/index.htm aka https://ruwordnet.ru/ru aka "Тезаурус РуТез"
- Discontinued and closed with a trimmed version free for use: Словарь В. Н. Тришинa


