from django.shortcuts import render
from django.http import JsonResponse
from . import utils
import json
from .models import Task


def index(request):
    return render(request, "frequencyapp/index.html")


def submit(request):
    if "binaryfile" in request.FILES:
        if not utils.is_file_size_ok(request):
            return JsonResponse(
                {"frequency": {}, "input_type": "file", "error": "oversize"},
                json_dumps_params={"ensure_ascii": False}
            )
        else:
            user_file = request.FILES["binaryfile"].file
            temp_file_name = utils.create_temp_file(user_file)
            task_id, task_status = utils.create_task(temp_file_name, is_file=True)
            return JsonResponse({"id": task_id, "status": task_status}, json_dumps_params={"ensure_ascii": False})
    else:
        user_string = json.loads(request.body)["usertext"]
        task_id, task_status = utils.create_task(user_string)
        return JsonResponse({"id": task_id, "status": task_status}, json_dumps_params={"ensure_ascii": False})


def result(request):
    task_id = json.loads(request.body)["id"]
    task = Task.objects.get(id=task_id)
    status = task.status
    if status == "finish":
        response = task.response
        utils.delete_task_and_files(task_id)
        return JsonResponse(response, json_dumps_params={'ensure_ascii': False})
    else:
        return JsonResponse({"id": task_id, "status": status}, json_dumps_params={'ensure_ascii': False})
