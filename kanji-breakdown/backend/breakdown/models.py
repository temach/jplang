from django.db import models

class Radical(models.Model):
    keyword = models.CharField(max_length=200)
    kanji = models.CharField(max_length=200)
    unicode = models.CharField(max_length=200)
    note = models.CharField(max_length=200)
    svg = models.CharField(max_length=10000)

class WorkElement(models.Model):
    radicals = models.CharField(max_length=10000)
    keyword = models.CharField(max_length=200)
    kanji = models.CharField(max_length=200)
    unicode = models.CharField(max_length=200)
    note = models.CharField(max_length=200)
    svg = models.CharField(max_length=10000)

