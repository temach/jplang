import unittest
import requests
from time import time


class TestStringMethods(unittest.TestCase):
    """
    in default settings on requests module not needed to pass headers
    headers = {"content-type": "application/x-www-form-urlencoded"}
    """

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

    def test_post_url(self):
        payload = {"usertext": "http://localhost:80/test_page.html"}
        r = requests.post("http://localhost:8005/submit", json=payload)
        r_json = r.json()
        self.assertTrue(r.status_code == requests.codes.ok)
        self.assertTrue(r_json["frequency"]["黺"] == 2)
        self.assertTrue(r_json["frequency"]["丆"] == 2)
        self.assertTrue(len(r_json["frequency"]) == 2)
        self.assertTrue(r_json["input_type"] == "url")
        self.assertTrue(r_json["error"] == "")

    def test_time(self):
        start_time = time()
        payload = {"usertext": "黺黺丆丆aa00"}
        r = requests.post("http://localhost:8005/submit", json=payload)
        delta_time = time() - start_time
        self.assertTrue(delta_time <= 3)
        self.assertTrue(r.status_code == requests.codes.ok)

    def test_empty_string(self):
        payload = {"usertext": ""}
        r = requests.post("http://localhost:8005/submit", json=payload)
        r_json = r.json()
        self.assertTrue(r.status_code == requests.codes.ok)
        self.assertTrue(len(r_json["frequency"]) == 0)


if __name__ == "__main__":
    unittest.main()
