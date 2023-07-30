from bottle import route, run, static_file, request, response
import json
from collections import Counter
import os
from requests_html import HTMLSession
import validators
import requests
import pytesseract
from PIL import Image
import io
import whisper
import tempfile
import shutil
import filetype

japan_ords = set(i for i in range(19969, 40959))


def frequency(user_string):
    return {k: v for k, v in Counter(user_string).most_common() if ord(k) in japan_ords}


def is_url(user_string):
    return validators.url(user_string) is True


def is_image_url(user_string):
    response = requests.head(user_string)
    mime_type = response.headers.get("Content-Type")
    return mime_type and mime_type.startswith("image/")


def is_image_file(user_file):
    try:
        with Image.open(user_file) as _:
            return True
    except:
        return False


def is_audio_file(user_file):
    audio_info = filetype.guess(user_file)
    return audio_info and audio_info.mime.startswith("audio/")


def url_parse(user_string):
    session = HTMLSession()
    parse = session.get(user_string)
    parse.html.render(timeout=40)
    result = parse.html.html
    return result


def audio_transcribe(user_file):
    with tempfile.NamedTemporaryFile() as fp:
        shutil.copyfileobj(user_file, fp)
        model = whisper.load_model("base")
        result = model.transcribe(fp.name, language="ja", fp16=False)
        return result["text"]


def save_image(user_string, memoryfile):
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


def extract_text(file):
    text = pytesseract.image_to_string(file, config=f"--psm 11 --oem 1", lang="jpn")
    return text


    # TODO:
    # This programm have a promblems with "data:"-urls
def prepare_image_and_text_return(user_string):
    with io.BytesIO() as memoryfile:
        image_fileobject = save_image(user_string, memoryfile)
        text = convert_image_file_and_text_return(image_fileobject)
    return text


def convert_image_file_and_text_return(user_image):
    png_image_bytes = convert_to_png(user_image)
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
    dict_of_frequency = {"frequency": {}, "input_type": "", "error": ""}

    if "binaryfile" in request.files:
        user_file = request.files.get("binaryfile").file
        isimagefile = is_image_file(user_file)
        isaudiofile = is_audio_file(user_file)

        if isimagefile:
            catch_errors(dict_of_frequency, convert_image_file_and_text_return, "image", user_file,)
        elif isaudiofile:
            catch_errors(dict_of_frequency, audio_transcribe, "audio", user_file)
        else:
            catch_errors(dict_of_frequency, frequency, "text", user_file.read().decode("utf-8"))

    else:
        try:
            user_string = request.json["usertext"]
        except UnicodeDecodeError as e:
            user_string = request.json["usertext"].encode("ISO-8859-1").decode("utf-8")

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
