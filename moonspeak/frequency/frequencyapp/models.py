from django.db import models


class RequestCounter(models.Model):
    content_type = models.CharField(max_length=10)
    count = models.PositiveIntegerField(default=0)


class Tasks(models.Model):
    id = models.AutoField(primary_key=True)
    request = models.TextField()
    response = models.JSONField(null=True)
    status = models.CharField(max_length=20)
    file = models.BooleanField(default=False)
