from django.core.management.base import BaseCommand
from ... import utils
import time
import traceback
import signal


class Command(BaseCommand):

    def process_task(self, task, output_dict_of_frequency):
        if task.file:
            if utils.is_image_file(task.request):
                utils.apply_func(output_dict_of_frequency, utils.convert_image_file_and_text_return, "image", task.request)
            elif utils.is_audio_file(task.request):
                utils.apply_func(output_dict_of_frequency, utils.audio_transcribe, "audio", task.request)
            elif utils.is_video_file(task.request):
                utils.apply_func(output_dict_of_frequency, utils.audio_transcribe, "video", task.request)
            else:
                utils.apply_func(output_dict_of_frequency, utils.text_from_textfile, "text", task.request)

        else:
            isurl = utils.is_url(task.request)
            if isurl and utils.is_image_url(task.request):
                utils.apply_func(output_dict_of_frequency, utils.prepare_image_and_text_return, "image", task.request)
            elif isurl:
                utils.apply_func(output_dict_of_frequency, utils.url_parse, "url", task.request)
            else:
                utils.apply_func(output_dict_of_frequency, utils.frequency, "text", task.request)


    def handle(self, *args, **options):
        # handler and variable capture to exit infinite loop nicely when signalled
        keep_running = True
        def handle_shutdown(signum, frame):
            nonlocal keep_running
            keep_running = False
        signal.signal(signal.SIGTERM, handle_shutdown)
        signal.signal(signal.SIGINT, handle_shutdown)

        while keep_running:
            dict_of_frequency = {"frequency": {}, "input_type": "", "error": ""}
            task = utils.get_task_to_work()

            if not task:
                # when nothing to do, cleanup db
                utils.clean_useless_tasks()
                time.sleep(0.5)
                continue

            try:
                self.process_task(task, dict_of_frequency)
            except Exception as err:
                print("".join(traceback.format_stack()))
                print(traceback.format_exc())
                dict_of_frequency["error"] = str(err)

            # the input_type field is filled in the apply_func function call
            # but maybe we did not get to determine the input type
            if not dict_of_frequency["input_type"]:
                dict_of_frequency["input_type"] = "unknown"

            utils.bump_request_counter(dict_of_frequency["input_type"])
            utils.write_result_and_finish_task(task, dict_of_frequency)
