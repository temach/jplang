from bottle import route, run, static_file, request
import json
import string
from collections import defaultdict



nums_ords = [i for i in range(48, 58)]
latin_ords = [i for i in range(97, 123)]
japan_ords = [i for i in range(19969, 40959)]
all_ords = set(nums_ords + latin_ords + japan_ords)

def frequency(user_string):
    dict_chr_counter = defaultdict(int)
    for i in user_string:
        if ord(i) in all_ords:
            dict_chr_counter[i] += 1
    return {key: value for key, value in sorted(dict_chr_counter.items(), key=lambda item: item[1], reverse=True)}




@route('/')
def index():
    return static_file('index.html', root='../frontend/')

@route('/submit', method="POST")
def submit():
    user_string = request.forms.get('usertext').encode(
        'ISO-8859-1').decode('utf-8')
    return json.dumps(frequency(user_string.lower()), ensure_ascii=False)

run(host='localhost', port=8080, debug=True)