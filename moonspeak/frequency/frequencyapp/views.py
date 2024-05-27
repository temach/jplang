from django.shortcuts import render
from django.http import JsonResponse
from . import utils
import json
from .models import Task
import traceback


def index(request):
    return render(request, "frequencyapp/index.html")


def api_404_catchall(request):
    # substitutes django's 404 page so we match the openapi schema
    return HttpResponse(status=404)


def submit(request):
    if "binaryfile" in request.FILES:
        if not utils.is_file_size_ok(request):
            return JsonResponse(
                {"frequency": {}, "input_type": "file", "error": "oversize"},
                json_dumps_params={"ensure_ascii": False},
                status=400
            )
        else:
            user_file = request.FILES["binaryfile"].file
            temp_file_name = utils.create_temp_file(user_file)
            task_id, task_status = utils.create_task(temp_file_name, is_file=True)
            return JsonResponse({"id": task_id, "status": task_status}, json_dumps_params={"ensure_ascii": False}, status=202)
    else:
        try:
            user_string = json.loads(request.body)["usertext"]
        except Exception as err:
            print("".join(traceback.format_stack()))
            print(traceback.format_exc())
            return JsonResponse(
                {"frequency": {}, "input_type": "text", "error": 'no valid "usertext" field'},
                json_dumps_params={"ensure_ascii": False},
                status=400
            )
        task_id, task_status = utils.create_task(user_string)
        return JsonResponse({"id": task_id, "status": task_status}, json_dumps_params={"ensure_ascii": False}, status=202)


def result(request, task_id):
    try:
        task = Task.objects.get(id=task_id)
    except Exception as err:
        print("".join(traceback.format_stack()))
        print(traceback.format_exc())
        return JsonResponse(
            {"id": task_id, "status": 'notfound'},
            json_dumps_params={"ensure_ascii": False},
            status=404,
        )
    status = task.status
    if status == "finish":
        response = task.response
        return JsonResponse(response, json_dumps_params={'ensure_ascii': False})
    else:
        return JsonResponse({"id": task_id, "status": status}, json_dumps_params={'ensure_ascii': False}, status=202)
