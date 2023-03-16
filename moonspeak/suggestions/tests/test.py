import unittest
import requests
from time import time


class TestStringMethods(unittest.TestCase):
    """
    in default settings on requests module not needed to pass headers
    headers = {"content-type": "application/x-www-form-urlencoded"}
    """

    def test_true_word(self):
        r = requests.get("http://localhost:8042/localhost/api/suggestions/%E7%94%BB")
        r_json = r.json()
        self.assertTrue(r.status_code == requests.codes.ok)
        self.assertTrue(
            r_json[1]["freq"] == [665, 631] and r_json[1]["word"] == "picture"
        )
        self.assertTrue(
            r_json[3]["freq"] == [39793, 39293] and r_json[3]["word"] == "tableau"
        )
        self.assertTrue(
            r_json[5]["freq"] == [665, 631] and r_json[5]["word"] == "picture"
        )

    def test_unknow_word(self):
        r = requests.get("http://localhost:8042/localhost/api/suggestions/%E7%94%BB")
        r_json = r.json()
        self.assertTrue(r.status_code == requests.codes.ok)
        self.assertTrue(
            r_json[0]["freq"] == [-1, -1] and r_json[0]["word"] == "brush-stroke"
        )
        self.assertTrue(
            r_json[2]["freq"] == [-1, -1] and r_json[2]["word"] == "draw up a plan"
        )
        self.assertTrue(
            r_json[4]["freq"] == [-1, -1] and r_json[4]["word"] == "brush-stroke"
        )
        self.assertTrue(
            r_json[6]["freq"] == [-1, -1] and r_json[6]["word"] == "a drawing"
        )


if __name__ == "__main__":
    unittest.main()
