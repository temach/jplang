# Generated by Django 4.2.1 on 2023-09-12 10:42

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("frequencyapp", "0007_task_created"),
    ]

    operations = [
        migrations.AddField(
            model_name="task",
            name="finished",
            field=models.DateTimeField(blank=True, editable=False, null=True),
        ),
    ]
