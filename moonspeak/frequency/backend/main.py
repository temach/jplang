from bottle import route, run, static_file, request, response
import json
from collections import Counter
import os
from requests_html import HTMLSession
import validators

japan_ords = set(i for i in range(19969, 40959))


def frequency(user_string):
    return {k: v for k, v in Counter(user_string).most_common() if ord(k) in japan_ords}


def is_url(user_string):
    return validators.url(user_string) == True


def url_parse(user_string):
    session = HTMLSession()
    parse = session.get(user_string)
    parse.html.render(timeout=40)
    result = parse.html.html
    return result


@route("/")
def index():
    return static_file("index.html", root="../frontend/")


@route("/submit", method="POST")
def submit():
    dict_of_frequency = {"frequency": {}, "input_type": "", "error": ""}
    try:
        user_string = request.json["usertext"]
    except UnicodeDecodeError as e:
        user_string = request.json["usertext"].encode("ISO-8859-1").decode("utf-8")
    if is_url(user_string):
        dict_of_frequency["input_type"] = "url"
        try:
            dict_of_frequency["frequency"] = frequency(url_parse(user_string))
        except Exception as err:
            dict_of_frequency["error"] = str(err)
    else:
        dict_of_frequency["frequency"] = frequency(user_string)
        dict_of_frequency["input_type"] = "text"

    response.set_header("content-type", "application/json")
    return json.dumps(dict_of_frequency, ensure_ascii=False)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Feature, run as "python main.py"')

    # "0.0.0.0" and "moonspeak.localhost" break on windows only "localhost" is portable
    parser.add_argument(
        "--host",
        type=str,
        default=os.getenv("MOONSPEAK_HOST", "localhost"),
        help="hostname to bind",
    )

    parser.add_argument(
        "--port",
        type=int,
        default=os.getenv("MOONSPEAK_PORT", 8005),
        help="port number",
    )
    args = parser.parse_args()

    # other
    print("Running bottle server on port {}".format(args.port))
    run(host=args.host, port=args.port)
