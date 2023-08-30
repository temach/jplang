import unittest
import requests
import time
import subprocess


cmd_django_server = "python /frequency/manage.py runserver 0.0.0.0:8005" \
             " --noreload --nothreading --settings=frequency.test_settings"

cmd_python_sever = "python -m http.server -b 127.0.0.1" \
                   " -d /frequency/tests/testdata/ 8000"

class TestDjangoServer(unittest.TestCase):
    """
    in default settings on requests module not needed to pass headers
    headers = {"content-type": "application/x-www-form-urlencoded"}
    """

    @classmethod
    def setUpClass(cls):
        cls.server_process = subprocess.Popen(cmd_django_server.split())
        time.sleep(5)

    @classmethod
    def tearDownClass(cls):
        cls.server_process.kill()

    # these tests were written for docker
    # for local tests use path: "./testdata/..."
    def test_post_text_file(self):
        with open("/frequency/tests/testdata/test_page.html", "rb") as file:
            payload = {"binaryfile": file}
            r = requests.post("http://localhost:8005/submit", files=payload)
            r_json = r.json()
            self.assertTrue(r.status_code == requests.codes.ok)
            self.assertTrue(r_json["frequency"]["黺"] == 2)
            self.assertTrue(r_json["frequency"]["丆"] == 2)
            self.assertTrue(len(r_json["frequency"]) == 2)
            self.assertTrue(r_json["input_type"] == "text")
            self.assertTrue(r_json["error"] == "")

    def test_post_audio_file_mp3(self):
        with open("/frequency/tests/testdata/test_audio.mp3", "rb") as file:
            payload = {"binaryfile": file}
            r = requests.post("http://localhost:8005/submit", files=payload)
            r_json = r.json()
            self.assertTrue(r.status_code == requests.codes.ok)
            self.assertTrue(r_json["frequency"]["前"] == 1)
            self.assertTrue(r_json["frequency"]["死"] == 1)
            self.assertTrue(len(r_json["frequency"]) == 2)
            self.assertTrue(r_json["input_type"] == "audio")
            self.assertTrue(r_json["error"] == "")

    def test_post_audio_file_wav(self):
        with open("/frequency/tests/testdata/test_audio.wav", "rb") as file:
            payload = {"binaryfile": file}
            r = requests.post("http://localhost:8005/submit", files=payload)
            r_json = r.json()
            self.assertTrue(r.status_code == requests.codes.ok)
            self.assertTrue(r_json["frequency"]["前"] == 1)
            self.assertTrue(r_json["frequency"]["死"] == 1)
            self.assertTrue(len(r_json["frequency"]) == 2)
            self.assertTrue(r_json["input_type"] == "audio")
            self.assertTrue(r_json["error"] == "")

    def test_post_audio_file_ogg(self):
        with open("/frequency/tests/testdata/test_audio.ogg", "rb") as file:
            payload = {"binaryfile": file}
            r = requests.post("http://localhost:8005/submit", files=payload)
            r_json = r.json()
            self.assertTrue(r.status_code == requests.codes.ok)
            self.assertTrue(r_json["frequency"]["前"] == 1)
            self.assertTrue(r_json["frequency"]["死"] == 1)
            self.assertTrue(len(r_json["frequency"]) == 2)
            self.assertTrue(r_json["input_type"] == "audio")
            self.assertTrue(r_json["error"] == "")

    def test_post_video_file_mp4(self):
        with open("/frequency/tests/testdata/test_video.mp4", "rb") as file:
            payload = {"binaryfile": file}
            r = requests.post("http://localhost:8005/submit", files=payload)
            r_json = r.json()
            self.assertTrue(r.status_code == requests.codes.ok)
            self.assertTrue(r_json["frequency"]["前"] == 1)
            self.assertTrue(r_json["frequency"]["死"] == 1)
            self.assertTrue(len(r_json["frequency"]) == 2)
            self.assertTrue(r_json["input_type"] == "video")
            self.assertTrue(r_json["error"] == "")

    def test_post_video_file_avi(self):
        with open("/frequency/tests/testdata/test_video.avi", "rb") as file:
            payload = {"binaryfile": file}
            r = requests.post("http://localhost:8005/submit", files=payload)
            r_json = r.json()
            self.assertTrue(r.status_code == requests.codes.ok)
            self.assertTrue(r_json["frequency"]["前"] == 1)
            self.assertTrue(r_json["frequency"]["死"] == 1)
            self.assertTrue(len(r_json["frequency"]) == 2)
            self.assertTrue(r_json["input_type"] == "video")
            self.assertTrue(r_json["error"] == "")

    def test_post_image_file(self):
        with open("/frequency/tests/testdata/test_image.jpg", "rb") as file:
            payload = {"binaryfile": file}
            r = requests.post("http://localhost:8005/submit", files=payload)
            r_json = r.json()
            self.assertTrue(r.status_code == requests.codes.ok)
            self.assertTrue(r_json["frequency"]["田"] == 1)
            self.assertTrue(r_json["frequency"]["力"] == 1)
            self.assertTrue(r_json["frequency"]["男"] == 1)
            self.assertTrue(len(r_json["frequency"]) == 3)
            self.assertTrue(r_json["input_type"] == "image")
            self.assertTrue(r_json["error"] == "")

    def test_post_text(self):
        payload = {"usertext": "黺黺丆丆aa00"}
        r = requests.post("http://localhost:8005/submit", json=payload)
        r_json = r.json()
        self.assertTrue(r.status_code == requests.codes.ok)
        self.assertTrue(r_json["frequency"]["黺"] == 2)
        self.assertTrue(r_json["frequency"]["丆"] == 2)
        self.assertTrue(len(r_json["frequency"]) == 2)
        self.assertTrue(r_json["input_type"] == "text")
        self.assertTrue(r_json["error"] == "")

    def test_time(self):
        start_time = time.time()
        payload = {"usertext": "黺黺丆丆aa00"}
        r = requests.post("http://localhost:8005/submit", json=payload)
        delta_time = time.time() - start_time
        self.assertTrue(delta_time <= 3)
        self.assertTrue(r.status_code == requests.codes.ok)

    def test_empty_string(self):
        payload = {"usertext": ""}
        r = requests.post("http://localhost:8005/submit", json=payload)
        r_json = r.json()
        self.assertTrue(r.status_code == requests.codes.ok)
        self.assertTrue(len(r_json["frequency"]) == 0)

    def test_file_size(self):
        with open("/frequency/tests/testdata/test_oversize_file.txt", "rb") as file:
            payload = {"binaryfile": file}
            r = requests.post("http://localhost:8005/submit", files=payload)
            r_json = r.json()
            self.assertTrue(r.status_code == requests.codes.ok)
            self.assertTrue(len(r_json["frequency"]) == 0)
            self.assertTrue(r_json["input_type"] == "file")
            self.assertTrue(r_json["error"] == "oversize")


class TestLocalAndDjangoSevers(unittest.TestCase):
    """
    in default settings on requests module not needed to pass headers
    headers = {"content-type": "application/x-www-form-urlencoded"}
    """

    @classmethod
    def setUpClass(cls):
        cls.server_process = subprocess.Popen(cmd_django_server.split())
        cls.test_server_process = subprocess.Popen(cmd_python_sever.split())
        time.sleep(5)

    @classmethod
    def tearDownClass(cls):
        cls.server_process.kill()
        cls.test_server_process.kill()

    # these tests were written for docker
    # for local tests use path: "./testdata/..."
    def test_post_url(self):
        payload = {"usertext": f"http://127.0.0.1:8000/test_page.html"}
        r = requests.post("http://localhost:8005/submit", json=payload)
        r_json = r.json()
        self.assertTrue(r.status_code == requests.codes.ok)
        self.assertTrue(r_json["frequency"]["黺"] == 2)
        self.assertTrue(r_json["frequency"]["丆"] == 2)
        self.assertTrue(len(r_json["frequency"]) == 2)
        self.assertTrue(r_json["input_type"] == "url")
        self.assertTrue(r_json["error"] == "")

    def test_post_image_url(self):
        payload = {"usertext": f"http://127.0.0.1:8000/test_image.jpg"}
        r = requests.post("http://localhost:8005/submit", json=payload)
        r_json = r.json()
        self.assertTrue(r.status_code == requests.codes.ok)
        self.assertTrue(r_json["frequency"]["田"] == 1)
        self.assertTrue(r_json["frequency"]["力"] == 1)
        self.assertTrue(r_json["frequency"]["男"] == 1)
        self.assertTrue(len(r_json["frequency"]) == 3)
        self.assertTrue(r_json["input_type"] == "image")
        self.assertTrue(r_json["error"] == "")


if __name__ == "__main__":
    unittest.main()
