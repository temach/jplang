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
from collections import Counter
import os
from .models import RequestCounter

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
    file_info = filetype.guess(user_file)
    return file_info and file_info.mime.startswith("audio/")


def is_video_file(user_file):
    file_info = filetype.guess(user_file)
    return file_info and file_info.mime.startswith("video/")


def is_file_size_ok(request):
    file_size_bytes = int(request.META.get("CONTENT_LENGTH", -1))
    return 0 < file_size_bytes <= 10 * 1024 * 1024  # max 10MB


def url_parse(user_string):
    session = HTMLSession()
    parse = session.get(user_string)
    parse.html.render(timeout=40)
    result = parse.html.html
    return result


def audio_transcribe(user_file):
    # weird bug: sometimes large files do not load fully (missing a few bytes from the end)
    # unless we seek to the end at least once, maybe this is a bottle.py bug?

    user_file.seek(0, os.SEEK_END)
    user_file.seek(0, os.SEEK_SET)
    with tempfile.NamedTemporaryFile(dir=".") as fp:
        shutil.copyfileobj(user_file, fp)
        fp.flush()
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
    # This program have a problems with "data:"-urls
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


def request_counter(content_type):
        counter = RequestCounter.objects.get(content_type=content_type)
        counter.count += 1
        counter.save()
