from bottle import route, run, static_file, request, response
import json
from collections import Counter
import os
from requests_html import HTMLSession

latin_ords = set(i for i in range(97, 123))
japan_ords = set(i for i in range(19969, 40959))
all_ords = latin_ords | japan_ords


def frequency(user_string: str):
    try:
        session = HTMLSession()
        parse = session.get(user_string)
        parse.html.render(timeout=40)
        html_page_text = parse.html.html
        list_japan_chars_from_url = [i for i in html_page_text if ord(i) in japan_ords]
        japan_chars_from_url = {i: list_japan_chars_from_url.count(i) for i in set(list_japan_chars_from_url)}
        result = {key: value for key, value in sorted(japan_chars_from_url.items(), key=lambda item: item[1], reverse=True)}
        return result
    except:
        result = Counter(user_string)
        sorted_result = result.most_common()
        return {k: v for k, v in sorted_result if ord(k) in all_ords}
    

@route("/")
def index():
    return static_file("index.html", root="../frontend/")


@route("/submit", method="POST")
def submit():
    try:
        user_string = request.json["usertext"]
    except UnicodeDecodeError as e:
        user_string = request.json["usertext"].encode("ISO-8859-1").decode("utf-8")

    response.set_header("content-type", "application/json")
    return json.dumps(frequency(user_string.lower()), ensure_ascii=False)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Feature, run as "python main.py"')
    parser.add_argument(
        "--host",
        type=str,
        default=os.getenv("MOONSPEAK_HOST", "moonspeak.localhost"),
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
