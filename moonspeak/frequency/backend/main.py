from bottle import route, run, static_file, request
import json
from collections import Counter
import os

nums_ords = set(i for i in range(48, 58))
latin_ords = set(i for i in range(97, 123))
japan_ords = set(i for i in range(19969, 40959))
all_ords = nums_ords | latin_ords | japan_ords


def frequency(user_string: str):
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
        user_string = request.json.get("usertext").encode("ISO-8859-1").decode("utf-8")

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
