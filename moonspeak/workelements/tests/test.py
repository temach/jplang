import unittest
import requests
from time import time


class TestStringMethods(unittest.TestCase):
    """
    in default settings on requests module not needed to pass headers
    headers = {"content-type": "application/x-www-form-urlencoded"}
    """

    def test_unknow_word(self):
        r = requests.get(
            "http://localhost:8040/localhost/api/keywordcheck/%E5%A4%A7/colossakeke"
        )
        r_json = r.json()
        self.assertTrue(r.status_code == requests.codes.ok)
        self.assertTrue(r_json["freq"] == [-1, -1])

    def test_true_word(self):
        r = requests.get(
            "http://localhost:8040/localhost/api/keywordcheck/%E5%A4%A7/colossal"
        )
        r_json = r.json()
        self.assertTrue(r.status_code == requests.codes.ok)
        self.assertTrue(r_json["freq"] == [13429, 27383])


if __name__ == "__main__":
    unittest.main()
