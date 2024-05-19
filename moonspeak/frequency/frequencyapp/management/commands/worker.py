from django.core.management.base import BaseCommand
from ... import utils
import time


class Command(BaseCommand):
    def handle(self, *args, **options):
        while True:
            dict_of_frequency = {"frequency": {}, "input_type": "", "error": ""}
            task = utils.get_task_to_work()
            
            if not task:
                time.sleep(0.5)
                continue

            if task.file:

                if utils.is_image_file(task.request):
                    utils.catch_errors(dict_of_frequency, utils.convert_image_file_and_text_return, "image", task.request)
                elif utils.is_audio_file(task.request):
                    utils.catch_errors(dict_of_frequency, utils.audio_transcribe, "audio", task.request)
                elif utils.is_video_file(task.request):
                    utils.catch_errors(dict_of_frequency, utils.audio_transcribe, "video", task.request)
                else:
                    utils.catch_errors(dict_of_frequency, utils.text_from_textfile, "text", task.request)

            else:

                isurl = utils.is_url(task.request)

                if isurl and utils.is_image_url(task.request):
                    utils.catch_errors(dict_of_frequency, utils.prepare_image_and_text_return, "image", task.request)
                elif isurl:
                    utils.catch_errors(dict_of_frequency, utils.url_parse, "url", task.request)
                else:
                    utils.catch_errors(dict_of_frequency, utils.frequency, "text", task.request)

            # the input_type field is filled after the catch_errors function call
            utils.bump_request_counter(dict_of_frequency["input_type"])
            utils.write_result_and_finish_task(task, dict_of_frequency)
