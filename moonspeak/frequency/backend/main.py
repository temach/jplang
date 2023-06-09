from bottle import route, run, static_file, request, response
import json
from collections import Counter
import os
from requests_html import HTMLSession
import validators
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


def url_parse(user_string):
    session = HTMLSession()
    parse = session.get(user_string)
    parse.html.render(timeout=40)
    result = parse.html.html
    return result


def is_image_url(user_string):
    response = requests.head(user_string)
    mime_type = response.headers.get("Content-Type")
    return True if mime_type and mime_type.startswith("image/") else False


def save_image(user_string, memoryfile):
    parsed_url = urlparse(user_string)
    response = requests.get(user_string, stream=True)
    for chunk in response.iter_content(1024):
        memoryfile.write(chunk)
    return memoryfile


def convert_to_png(fileobject):
    image = Image.open(fileobject)
    image = image.convert("RGBA")
    with io.BytesIO() as mem:
        image.save(mem, format="PNG")
        mem.seek(0)
        image_bytes = mem.read()
    return image_bytes


def extract_text(image):
    text = pytesseract.image_to_string(image, config=f"--psm 11 --oem 1", lang="jpn")
    return text


    # TODO:
    # This programm have a promblems with "data:"-urls
def prepare_image_and_text_return(user_string):
    with io.BytesIO() as memoryfile:
        image_fileobject = save_image(user_string, memoryfile)
        png_image_bytes = convert_to_png(image_fileobject)
        image_png = Image.open(io.BytesIO(png_image_bytes))
        text = extract_text(image_png)
    return text


def catch_errors(result, func, input_type, string):
    if input_type == "text":
        result["input_type"] = input_type
        result["frequency"] = func(string)
        return
    result["input_type"] = input_type
    try:
        result["frequency"] = frequency(func(string))
    except Exception as err:
        result["error"] = str(err)


@route("/")
def index():
    return static_file("index.html", root="../frontend/")


@route("/submit", method="POST")
def submit():
    try:
        user_string = request.json["usertext"]
    except UnicodeDecodeError as e:
        user_string = request.json["usertext"].encode("ISO-8859-1").decode("utf-8")

    dict_of_frequency = {"frequency": {}, "input_type": "", "error": ""}
    isurl = is_url(user_string)
    isimageurl = isurl and is_image_url(user_string)

    if isimageurl:
        catch_errors(dict_of_frequency, prepare_image_and_text_return, "image", user_string)
    elif isurl:
        catch_errors(dict_of_frequency, url_parse, "url", user_string)
    else:
        catch_errors(dict_of_frequency, frequency, "text", user_string)

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
