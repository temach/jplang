from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from . import utils
import json
from .models import Task
import traceback


def index(request):
    return render(request, "frequencyapp/index.html")


def submit(request):
    if request.content_type == "multipart/form-data":
        if not utils.is_file_size_ok(request):
            return JsonResponse({"error": "oversize", "input_type": "file"}, status=400)
        try:
            user_file = request.FILES["binaryfile"].file
        except Exception as err:
            print("".join(traceback.format_stack()))
            print(traceback.format_exc())
            return JsonResponse({"error": 'no valid "binaryfile" field', "input_type": "file"}, status=400)
        temp_file_name = utils.create_temp_file(user_file)
        task_id, task_status = utils.create_task(temp_file_name, is_file=True)
        return JsonResponse({"id": task_id}, status=202)

    elif request.content_type == "application/json":
        try:
            user_string = json.loads(request.body)["usertext"]
            assert len(user_string) > 0, 'json "usertext" field has invalid value'
        except Exception as err:
            print("".join(traceback.format_stack()))
            print(traceback.format_exc())
            return JsonResponse({"error": 'no valid "usertext" field', "input_type": "text"}, status=400)
        task_id, task_status = utils.create_task(user_string)
        return JsonResponse({"id": task_id}, status=202)

    else:
        return JsonResponse({"error": 'no valid "content-type" header', "input_type": "unknown"}, status=400)


def result(request, task_id):
    try:
        task = Task.objects.get(id=task_id)
    except Exception as err:
        print("".join(traceback.format_stack()))
        print(traceback.format_exc())
        return HttpResponse(status=404)
    if task.status == "finish":
        return JsonResponse(task.response, json_dumps_params={'ensure_ascii': False}, status=200)
    else:
        return HttpResponse(status=202)
