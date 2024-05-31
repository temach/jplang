import unittest
import requests
import time
import subprocess
import shlex


cmd_run_worker = shlex.split("python3 manage.py worker")

cmd_django_server = shlex.split("python3 manage.py runserver 0.0.0.0:8005 --noreload --nothreading --settings=frequency.test_settings")

cmd_data_server = shlex.split("python3 -m http.server -b 127.0.0.1 -d ./tests/testdata/ 8000")

cmd_run_fuzzer = shlex.split("""schemathesis run /opt/moonspeak/openapi.yaml --base-url http://localhost:8005 --hypothesis-max-examples=1000
                       --contrib-openapi-fill-missing-examples --contrib-openapi-formats-uuid  --validate-schema=true --data-generation-method=all --checks=all
                       --force-color --verbosity --schemathesis-io-telemetry=false""")


class TestLocalAndDjangoSevers(unittest.TestCase):
    """
    in default settings on requests module not needed to pass headers
    headers = {"content-type": "application/x-www-form-urlencoded"}
    """

    @classmethod
    def setUpClass(cls):
        cls.django_process = subprocess.Popen(cmd_django_server)
        cls.worker_process = subprocess.Popen(cmd_run_worker)
        cls.data_server_process = subprocess.Popen(cmd_data_server)
        time.sleep(6)

    @classmethod
    def tearDownClass(cls):
        cls.django_process.kill()
        cls.worker_process.kill()
        cls.data_server_process.kill()

    # these tests were written for docker
    # for local tests use path: "./testdata/..."
    def test_post_text_file(self):
        with open("./tests/testdata/test_page.html", "rb") as file:
            payload = {"binaryfile": file}
            r = requests.post("http://localhost:8005/api/submit", files=payload)
            r_json = r.json()
            while r.status_code == 202:
                r = requests.get(f'http://localhost:8005/api/result/{r_json["id"]}')
                time.sleep(1)
            self.assertTrue(r.ok)
            r_json = r.json()
            self.assertTrue(r_json["frequency"]["黺"] == 2)
            self.assertTrue(r_json["frequency"]["丆"] == 2)
            self.assertTrue(len(r_json["frequency"]) == 2)
            self.assertTrue(r_json["input_type"] == "text")
            self.assertTrue(r_json["error"] == "")

    def test_post_audio_file_mp3(self):
        with open("./tests/testdata/test_audio.mp3", "rb") as file:
            payload = {"binaryfile": file}
            r = requests.post("http://localhost:8005/api/submit", files=payload)
            r_json = r.json()
            while r.status_code == 202:
                r = requests.get(f'http://localhost:8005/api/result/{r_json["id"]}')
                time.sleep(1)
            self.assertTrue(r.ok)
            r_json = r.json()
            self.assertTrue(r_json["frequency"]["前"] == 1)
            self.assertTrue(r_json["frequency"]["死"] == 1)
            self.assertTrue(len(r_json["frequency"]) == 2)
            self.assertTrue(r_json["input_type"] == "audio")
            self.assertTrue(r_json["error"] == "")

    def test_post_audio_file_wav(self):
        with open("./tests/testdata/test_audio.wav", "rb") as file:
            payload = {"binaryfile": file}
            r = requests.post("http://localhost:8005/api/submit", files=payload)
            r_json = r.json()
            while r.status_code == 202:
                r = requests.get(f'http://localhost:8005/api/result/{r_json["id"]}')
                time.sleep(1)
            self.assertTrue(r.ok)
            r_json = r.json()
            self.assertTrue(r_json["frequency"]["前"] == 1)
            self.assertTrue(r_json["frequency"]["死"] == 1)
            self.assertTrue(len(r_json["frequency"]) == 2)
            self.assertTrue(r_json["input_type"] == "audio")
            self.assertTrue(r_json["error"] == "")

    def test_post_audio_file_ogg(self):
        with open("./tests/testdata/test_audio.ogg", "rb") as file:
            payload = {"binaryfile": file}
            r = requests.post("http://localhost:8005/api/submit", files=payload)
            r_json = r.json()
            while r.status_code == 202:
                r = requests.get(f'http://localhost:8005/api/result/{r_json["id"]}')
                time.sleep(1)
            self.assertTrue(r.ok)
            r_json = r.json()
            self.assertTrue(r_json["frequency"]["前"] == 1)
            self.assertTrue(r_json["frequency"]["死"] == 1)
            self.assertTrue(len(r_json["frequency"]) == 2)
            self.assertTrue(r_json["input_type"] == "audio")
            self.assertTrue(r_json["error"] == "")

    def test_post_video_file_mp4(self):
        with open("./tests/testdata/test_video.mp4", "rb") as file:
            payload = {"binaryfile": file}
            r = requests.post("http://localhost:8005/api/submit", files=payload)
            r_json = r.json()
            while r.status_code == 202:
                r = requests.get(f'http://localhost:8005/api/result/{r_json["id"]}')
                time.sleep(1)
            self.assertTrue(r.ok)
            r_json = r.json()
            self.assertTrue(r_json["frequency"]["前"] == 1)
            self.assertTrue(r_json["frequency"]["死"] == 1)
            self.assertTrue(len(r_json["frequency"]) == 2)
            self.assertTrue(r_json["input_type"] == "video")
            self.assertTrue(r_json["error"] == "")

    def test_post_video_file_avi(self):
        with open("./tests/testdata/test_video.avi", "rb") as file:
            payload = {"binaryfile": file}
            r = requests.post("http://localhost:8005/api/submit", files=payload)
            r_json = r.json()
            while r.status_code == 202:
                r = requests.get(f'http://localhost:8005/api/result/{r_json["id"]}')
                time.sleep(1)
            self.assertTrue(r.ok)
            r_json = r.json()
            self.assertTrue(r_json["frequency"]["前"] == 1)
            self.assertTrue(r_json["frequency"]["死"] == 1)
            self.assertTrue(len(r_json["frequency"]) == 2)
            self.assertTrue(r_json["input_type"] == "video")
            self.assertTrue(r_json["error"] == "")

    def test_post_image_file(self):
        with open("./tests/testdata/test_image.jpg", "rb") as file:
            payload = {"binaryfile": file}
            r = requests.post("http://localhost:8005/api/submit", files=payload)
            r_json = r.json()
            while r.status_code == 202:
                r = requests.get(f'http://localhost:8005/api/result/{r_json["id"]}')
                time.sleep(1)
            self.assertTrue(r.ok)
            r_json = r.json()
            self.assertTrue(r_json["frequency"]["田"] == 1)
            self.assertTrue(r_json["frequency"]["力"] == 1)
            self.assertTrue(r_json["frequency"]["男"] == 1)
            self.assertTrue(len(r_json["frequency"]) == 3)
            self.assertTrue(r_json["input_type"] == "image")
            self.assertTrue(r_json["error"] == "")

    def test_file_size(self):
        with open("./tests/testdata/test_oversize_file.txt", "rb") as file:
            payload = {"binaryfile": file}
            r = requests.post("http://localhost:8005/api/submit", files=payload)
            r_json = r.json()
            while r.status_code == 202:
                r = requests.get(f'http://localhost:8005/api/result/{r_json["id"]}')
                time.sleep(1)
            self.assertTrue(r.status_code == 400)
            self.assertTrue(r_json["input_type"] == "file")
            self.assertTrue(r_json["error"] == "oversize")

    # these tests were written for docker
    # for local tests use path: "./testdata/..."
    def test_post_url(self):
        payload = {"usertext": f"http://127.0.0.1:8000/test_page.html"}
        r = requests.post("http://localhost:8005/api/submit", json=payload)
        r_json = r.json()
        while r.status_code == 202:
            r = requests.get(f'http://localhost:8005/api/result/{r_json["id"]}')
            time.sleep(1)
        self.assertTrue(r.ok)
        r_json = r.json()
        self.assertTrue(r_json["frequency"]["黺"] == 2)
        self.assertTrue(r_json["frequency"]["丆"] == 2)
        self.assertTrue(len(r_json["frequency"]) == 2)
        self.assertTrue(r_json["input_type"] == "url")
        self.assertTrue(r_json["error"] == "")

    def test_post_image_url(self):
        payload = {"usertext": f"http://127.0.0.1:8000/test_image.jpg"}
        r = requests.post("http://localhost:8005/api/submit", json=payload)
        r_json = r.json()
        while r.status_code == 202:
            r = requests.get(f'http://localhost:8005/api/result/{r_json["id"]}')
            time.sleep(1)
        self.assertTrue(r.ok)
        r_json = r.json()
        self.assertTrue(r_json["frequency"]["田"] == 1)
        self.assertTrue(r_json["frequency"]["力"] == 1)
        self.assertTrue(r_json["frequency"]["男"] == 1)
        self.assertTrue(len(r_json["frequency"]) == 3)
        self.assertTrue(r_json["input_type"] == "image")
        self.assertTrue(r_json["error"] == "")

    def test_time(self):
        """
        On windows sometimes requests would take really long to load, its due to IPv6 query first:
        https://stackoverflow.com/questions/47766158/why-is-python-requests-to-localhost-slow
        """
        start_time = time.time()
        payload = {"usertext": "黺黺丆丆aa00"}
        r = requests.post("http://localhost:8005/api/submit", json=payload)
        r_json = r.json()
        while r.status_code == 202:
            r = requests.get(f'http://localhost:8005/api/result/{r_json["id"]}')
            time.sleep(1)
        delta_time = time.time() - start_time
        self.assertTrue(delta_time <= 3)
        self.assertTrue(r.ok)
        r_json = r.json()

    def test_post_text(self):
        payload = {"usertext": "黺黺丆丆aa00"}
        r = requests.post("http://localhost:8005/api/submit", json=payload)
        r_json = r.json()
        while r.status_code == 202:
            r = requests.get(f'http://localhost:8005/api/result/{r_json["id"]}')
            time.sleep(1)
        self.assertTrue(r.ok)
        r_json = r.json()
        self.assertTrue(r_json["frequency"]["黺"] == 2)
        self.assertTrue(r_json["frequency"]["丆"] == 2)
        self.assertTrue(len(r_json["frequency"]) == 2)
        self.assertTrue(r_json["input_type"] == "text")
        self.assertTrue(r_json["error"] == "")

    def test_empty_string_is_client_error(self):
        payload = {"usertext": ""}
        r = requests.post("http://localhost:8005/api/submit", json=payload)
        self.assertTrue(not r.ok)
        r_json = r.json()
        self.assertTrue(len(r_json["error"]) > 0)

    def test_bad_url_returns_server_error(self):
        payload = {"usertext": "http://some-domain-that-will-never-ever-resolve.com"}
        r = requests.post("http://localhost:8005/api/submit", json=payload)
        r_json = r.json()
        while r.status_code == 202:
            r = requests.get(f'http://localhost:8005/api/result/{r_json["id"]}')
            time.sleep(1)
        self.assertTrue(r.ok)
        r_json = r.json()
        self.assertTrue(len(r_json["error"]) > 0)
        self.assertTrue(len(r_json["input_type"]) > 0)


class TestZApiWithFuzzer(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # docker limits max log size, it will show up in build logs as: [output clipped, log limit 2MiB reached]
        # running fuzzer generates a lot logs, so disable output from django
        cls.django_process = subprocess.Popen(cmd_django_server, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        cls.worker_process = subprocess.Popen(cmd_run_worker, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(6)

    def test_api_with_fuzzer(self):
        fuzzer_result = subprocess.run(cmd_run_fuzzer, capture_output=True, text=True)
        print("fuzzer STDOUT and STDERR:\n", fuzzer_result.stdout, fuzzer_result.stderr, flush=True)
        self.assertEqual(fuzzer_result.returncode, 0, "fuzzer failed")

    @classmethod
    def tearDownClass(cls):
        cls.django_process.kill()
        cls.worker_process.kill()


if __name__ == "__main__":
    unittest.main()
