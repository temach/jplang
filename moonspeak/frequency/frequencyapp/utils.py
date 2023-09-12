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
from .models import RequestCounter, Task

japan_ords = set(i for i in range(19969, 40959))


def frequency(user_string: str) -> dict:
    """Checks whether a symbol is a Japanese character"""
    return {k: v for k, v in Counter(user_string).most_common() if ord(k) in japan_ords}


def is_url(user_string: str) -> bool:
    """Checks if a string is a URL"""
    return validators.url(user_string) is True


def is_image_url(user_string: str) -> bool:
    """Checks whether the string is a URL to an image"""
    response = requests.head(user_string)
    mime_type = response.headers.get("Content-Type")
    return mime_type and mime_type.startswith("image/")


def is_image_file(temp_file_name: str) -> bool:
    """Checks if the file is an image"""
    try:
        with Image.open(temp_file_name) as _:
            return True
    except:
        return False


def is_audio_file(temp_file_name: str) -> bool:
    """Checks if the file is audio"""
    file_info = filetype.guess(temp_file_name)
    return file_info and file_info.mime.startswith("audio/")


def is_video_file(temp_file_name: str) -> bool:
    """Checks if the file is a video"""
    file_info = filetype.guess(temp_file_name)
    return file_info and file_info.mime.startswith("video/")


def is_file_size_ok(request) -> bool:
    """Checks that the file does not exceed 10 MB"""
    file_bytes_size = int(request.META.get("CONTENT_LENGTH", -1))
    return 0 < file_bytes_size <= 10 * 1024 * 1024  # max 10MB


def url_parse(user_url: str) -> str:
    """Takes all characters from the HTML page"""
    session = HTMLSession()
    parse = session.get(user_url)
    parse.html.render(timeout=40)
    result = parse.html.html
    return result


def audio_transcribe(temp_file_name: str) -> str:
    """Converts audio with Japanese speech to text"""
    with open(temp_file_name, "rb") as f:
        model = whisper.load_model("base")
        result = model.transcribe(f.name, language="ja", fp16=False)
        return result["text"]


def save_image(user_string, memoryfile):
    """Saves an image as a memory file and returns a memory file object"""
    response = requests.get(user_string, stream=True)
    for chunk in response.iter_content(1024):
        memoryfile.write(chunk)
    return memoryfile


def convert_to_png(fileobject):
    """Converts an image to PNG and returns bytes"""
    image = Image.open(fileobject)
    image = image.convert("RGBA")
    with io.BytesIO() as mem:
        image.save(mem, format="PNG")
        mem.seek(0)
        image_bytes = mem.read()
    return image_bytes


def extract_text(file):
    """Extracts Japanese characters from an image"""
    text = pytesseract.image_to_string(file, config=f"--psm 11 --oem 1", lang="jpn")
    return text


    # TODO:
    # This program have a problems with "data:"-urls
def prepare_image_and_text_return(user_string):
    """
    Calls  image save, image conversion and text extraction functions.
    Returns Japanese characters.
    Called for image URLs.
    """
    with io.BytesIO() as memoryfile:
        image_fileobject = save_image(user_string, memoryfile)
        text = convert_image_file_and_text_return(image_fileobject)
    return text


def convert_image_file_and_text_return(user_image):
    """
    Calls image conversion and text extraction functions.
    Returns Japanese characters.
    Called for files
    """
    png_image_bytes = convert_to_png(user_image)
    image_png = Image.open(io.BytesIO(png_image_bytes))
    text = extract_text(image_png)
    return text


def text_from_textfile(file_path):
    """Extracts text from a text file"""
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()


def catch_errors(result, func, input_type, string):
    result["input_type"] = input_type
    try:
        result["frequency"] = frequency(func(string))
    except Exception as err:
        result["error"] = str(err)


def request_counter(content_type):
    """RequestCounter database update func. We can see the number of requests of each type"""
    counter = RequestCounter.objects.get(content_type=content_type)
    counter.count += 1
    counter.save()


def create_task(data, is_file=False):
    """Creates a new task in the Task model. Default is not a file"""
    new_task = Task(request=data, status="pending", file=is_file)
    new_task.save()
    return new_task.id, new_task.status


def get_task_to_work():
    """The worker takes the task to work and returns a database object"""
    pending_tasks = Task.objects.filter(status="pending")
    if pending_tasks.exists():
        task_to_processing = pending_tasks.order_by("timestamp_created").first()
        task_to_processing.status = "processing"
        task_to_processing.save()
        return task_to_processing


def write_result_and_finish_task(task, result):
    """The worker writes the result of the task to the database"""
    task.response = result
    task.status = "finish"
    task.save()


def delete_task_and_files(task_id):
    """The function deletes the task from the database and the temporary file"""
    task_to_delete = Task.objects.get(id=task_id)
    if task_to_delete.file is True:
        os.remove(task_to_delete.request)
    task_to_delete.delete()


def create_temp_file(user_file):
    """
    The function creates a temporary file.
    # weird bug: sometimes large files do not load fully (missing a few bytes from the end)
    # unless we seek to the end at least once, maybe this is a bottle.py bug?
    # user_file.seek(0, os.SEEK_END)
    # user_file.seek(0, os.SEEK_SET)
    """
    with tempfile.NamedTemporaryFile(dir=".", delete=False) as f:
        shutil.copyfileobj(user_file, f)
        f.flush()
        return f.name
