import unittest
import requests
import threading
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler


class MoonspeakTestServer(HTTPServer):
    # override to pin the directory
    def finish_request(self, request, client_address):
        self.RequestHandlerClass(request, client_address, self, directory="./testdata/")

    def start_in_background(self):
        httpd_thread = threading.Thread(target=self.serve_forever)
        httpd_thread.daemon = True
        httpd_thread.start()
        # sleep a bit before returning, so server has time to start
        time.sleep(2)


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
        # run our own test server
        address = ("localhost", 8000)
        with MoonspeakTestServer(address, SimpleHTTPRequestHandler) as httpd:
            httpd.start_in_background()
            payload = {"usertext": f"http://{address[0]}:{address[1]}/test_page.html"}
            r = requests.post("http://localhost:8005/submit", json=payload)
            r_json = r.json()
            self.assertTrue(r.status_code == requests.codes.ok)
            self.assertTrue(r_json["frequency"]["黺"] == 2)
            self.assertTrue(r_json["frequency"]["丆"] == 2)
            self.assertTrue(len(r_json["frequency"]) == 2)
            self.assertTrue(r_json["input_type"] == "url")
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


if __name__ == "__main__":
    unittest.main()
