from django.shortcuts import render
from django.http import JsonResponse
from . import utils
import json


def index(request):
    return render(request, "frequencyapp/index.html")


def submit(request):
    dict_of_frequency = {"frequency": {}, "input_type": "", "error": ""}

    if "binaryfile" in request.FILES:
        if not utils.is_file_size_ok(request):
            dict_of_frequency["input_type"] = "file"
            dict_of_frequency["error"] = "oversize"
        else:
            user_file = request.FILES["binaryfile"].file

            isimagefile = utils.is_image_file(user_file)
            isaudiofile = utils.is_audio_file(user_file)
            isvideofile = utils.is_video_file(user_file)

            if isimagefile:
                utils.catch_errors(dict_of_frequency, utils.convert_image_file_and_text_return, "image", user_file)
            elif isaudiofile:
                utils.catch_errors(dict_of_frequency, utils.audio_transcribe, "audio", user_file)
            elif isvideofile:
                utils.catch_errors(dict_of_frequency, utils.audio_transcribe, "video", user_file)
            else:
                utils.catch_errors(dict_of_frequency, utils.frequency, "text", user_file.read().decode("utf-8"))

    else:
        user_string = json.loads(request.body)["usertext"]

        isurl = utils.is_url(user_string)
        isimageurl = isurl and utils.is_image_url(user_string)

        if isimageurl:
            utils.catch_errors(dict_of_frequency, utils.prepare_image_and_text_return, "image", user_string)
        elif isurl:
            utils.catch_errors(dict_of_frequency, utils.url_parse, "url", user_string)
        else:
            utils.catch_errors(dict_of_frequency, utils.frequency, "text", user_string)

    # the input_type field is filled after the catch_errors function call
    utils.request_counter(dict_of_frequency["input_type"])

    return JsonResponse(dict_of_frequency, json_dumps_params={'ensure_ascii': False})
