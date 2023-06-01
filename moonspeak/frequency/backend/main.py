from bottle import route, run, static_file, request, response
import json
from collections import Counter
import os
from requests_html import HTMLSession
import validators
import imghdr
import urllib.request
import requests
from urllib.parse import urlparse
import pylibmagic
import pytesseract
from PIL import Image
import io

japan_ords = set(i for i in range(19969, 40959))


def frequency(user_string):
    return {k: v for k, v in Counter(user_string).most_common() if ord(k) in japan_ords}

def is_url(user_string):
    return validators.url(user_string) == True

def is_image_url(user_string):
    image_extension = imghdr.what(None, urllib.request.urlopen(user_string).read())
    return True if image_extension else False

def url_parse(user_string):
    session = HTMLSession()
    parse = session.get(user_string)
    parse.html.render(timeout=40)
    result = parse.html.html
    return result

def save_image(user_string):
    response = requests.get(user_string, stream=True)
    parsed_url = urlparse(user_string)
    filename = os.path.basename(parsed_url.path)
    with open(filename, 'wb') as file:
        for chunk in response.iter_content(1024):
            file.write(chunk)
    return filename

def convert_to_png(file):
    image = Image.open(file)
    image = image.convert('RGBA')
    with io.BytesIO() as mem:
        image.save(mem, format='PNG')
        mem.seek(0)
        image_bytes = mem.read()
    return image_bytes

def extract_text(image):
    text = pytesseract.image_to_string(image, config=f'--psm 11 --oem 1', lang='jpn')
    return text

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

#    a = is_url(user_string)
#    b = a and is_image_url(user_string)

    if is_url(user_string) and is_image_url(user_string):
        dict_of_frequency["input_type"] = "image_url"
        try:
            #This programm have a promblems with "data:"-urls
            saved_filename = save_image(user_string)
            image_bytes = convert_to_png(saved_filename)
            image_png = Image.open(io.BytesIO(image_bytes))
            dict_of_frequency["frequency"] = frequency(extract_text(image_png))
            os.remove(saved_filename)
        except Exception as err:
            dict_of_frequency["error"] = str(err)
    elif is_url(user_string):
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
