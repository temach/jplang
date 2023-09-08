from django.shortcuts import render
from django.http import JsonResponse
from . import utils
import json
from .models import Tasks


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
        task_id, task_status = utils.create_task(user_string)
        return JsonResponse({"id": task_id, "status": task_status}, json_dumps_params={'ensure_ascii': False})

    return JsonResponse(dict_of_frequency, json_dumps_params={'ensure_ascii': False})


def result(request):
    task_id = json.loads(request.body)["id"]
    task = Tasks.objects.get(id=task_id)
    status = task.status
    if status == "finish":
        response = task.response
        utils.delete_task(task_id)
        return JsonResponse(response, json_dumps_params={'ensure_ascii': False})
    else:
        return JsonResponse({"id": task_id, "status": status}, json_dumps_params={'ensure_ascii': False})
