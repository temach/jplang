from bottle import route, run, static_file, request
import json
import string
from collections import defaultdict
import os


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



if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Feature, run as "python main.py"')
    parser.add_argument('--port', type=int, default=os.getenv("MOONSPEAK_PORT", 8005), help='port number')
    args = parser.parse_args()

    # other
    print("Running bottle server on port {}".format(args.port))
    run(host='0.0.0.0', port=args.port)