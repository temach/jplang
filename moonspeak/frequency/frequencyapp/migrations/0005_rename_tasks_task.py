# Generated by Django 4.2.1 on 2023-09-11 07:00

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("frequencyapp", "0004_alter_tasks_request_alter_tasks_response"),
    ]

    operations = [
        migrations.RenameModel(
            old_name="Tasks",
            new_name="Task",
        ),
    ]
