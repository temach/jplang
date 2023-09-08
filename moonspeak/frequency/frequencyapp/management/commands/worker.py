from django.core.management.base import BaseCommand
from ...utils import *


class Command(BaseCommand):
    def handle(self, *args, **options):
        while True:
            dict_of_frequency = {"frequency": {}, "input_type": "", "error": ""}
            task = get_task_to_work()
            if task:
                isurl = is_url(task.request)
                isimageurl = isurl and is_image_url(task.request)

                if isimageurl:
                    catch_errors(dict_of_frequency, prepare_image_and_text_return, "image", task.request)
                elif isurl:
                    catch_errors(dict_of_frequency, url_parse, "url", task.request)
                else:
                    print("kek")
                    catch_errors(dict_of_frequency, frequency, "text", task.request)

                # the input_type field is filled after the catch_errors function call
                request_counter(dict_of_frequency["input_type"])
                write_result_and_finish_task(task, dict_of_frequency)
