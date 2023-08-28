from django.db import models


class RequestCounter(models.Model):
    content_type = models.CharField(max_length=10)
    count = models.PositiveIntegerField(default=0)
