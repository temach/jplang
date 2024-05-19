import uuid
from django.db import models
from django.utils import timezone
from django.db.models.signals import pre_save
from django.dispatch import receiver


class RequestCounter(models.Model):
    content_type = models.CharField(max_length=10)
    count = models.PositiveIntegerField(default=0)


class Task(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request = models.TextField()
    response = models.JSONField(null=True)
    status = models.CharField(max_length=20)
    file = models.BooleanField(default=False)
    timestamp_created = models.DateTimeField(default=timezone.now, editable=False)
    timestamp_finished = models.DateTimeField(null=True, blank=True, editable=False)


@receiver(pre_save, sender=Task)
def set_finished_time(sender, instance, **kwargs):
    if instance.status == "finish" and not instance.timestamp_finished:
        instance.timestamp_finished = timezone.now()
