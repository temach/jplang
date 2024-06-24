evomaster:
/opt/evomaster/bin/evomaster  --blackBox true --bbTargetUrl http://localhost:8005  --bbSwaggerUrl file:///opt/moonspeak/openapi.yaml  --outputFormat JS_JEST --maxTime 60s


dev-proxy urlsToWatch:
{
    "http://*/*",
    "https://*/*"
}


schemathesis:
st run --verbosity --hypothesis-max-examples=1500 --hypothesis-deadline=15000  --max-response-time=2000 --contrib-openapi-fill-missing-examples --contrib-openapi-formats-uuid  --validate-schema=true --data-generation-method=all --checks=all --base-url http://localhost:8005 --schemathesis-io-telemetry=false /opt/moonspeak/openapi.yaml


Other fuzzers to consider:
- https://github.com/Endava/cats
- https://github.com/isa-group/RESTest



Add sample record:
sqlite> insert into frequencyapp_task (id, status, request, file, timestamp_created) values ('3fa85f6457174562b3fc2c963f66afa6', 'finish', '{}', false, CURRENT_TIMESTAMP);

Add sample mp3 audio record to test worker:
sqlite> insert into frequencyapp_task (id, status, request, file, timestamp_created) values ('3fa85f6457174562b3fc2c963f66afa6', 'pending', '/opt/moonspeak/tests/testdata/test_audio.mp3', true, CURRENT_TIMESTAMP);


sqlite creates file with default hardcoded permissions, see: https://stackoverflow.com/questions/28454551/pdo-sqlite-create-database-default-permissions
it does not respect umask

e.g. add this to settings.py
# must touch the database file with correct mask so mod_wsgi under www-data can read/write
# see: https://sqlite.org/forum/info/063bc23e0b4264c87d5c6deae445fa3381aa62220a9e309ef794b9e8370816c4
# see: https://stackoverflow.com/questions/28454551/pdo-sqlite-create-database-default-permissions
# use os module, because for pathlib must also force umask
import os; os.close(os.open(DATABASES["default"]["NAME"], os.O_WRONLY | os.O_CREAT, 0o664))


Why mod_wsgi should not run python code with signals:
https://modwsgi.readthedocs.io/en/develop/configuration-directives/WSGIRestrictSignal.html


Make initial translation locales:
# python3 manage.py makemessages -d djangojs --locale en --locale ru -v 3
# python3 manage.py makemessages -d django --locale en --locale ru -v 3

Translations will generate ".po" files for django and djangojs:
./locale/ru/LC_MESSAGES/django.po
./locale/en/LC_MESSAGES/django.po
./frequencyapp/locale/ru/LC_MESSAGES/djangojs.po
./frequencyapp/locale/ru/LC_MESSAGES/django.po
./frequencyapp/locale/en/LC_MESSAGES/djangojs.po
./frequencyapp/locale/en/LC_MESSAGES/django.po

Then run periocally to update translations (this re-reads files and appends new strings):
# python3 manage.py makemessages -a -d djangojs -v 3
# python3 manage.py makemessages -a -d django -v 3

In Javascript gettext("") is detected, in templates {% translate "" %} is detected

After editing the translation files, compile them to binary:
# python3 manage.py compilemessages -v 3

Binary translations will generate ".mo" files:
./locale/ru/LC_MESSAGES/django.mo
./locale/en/LC_MESSAGES/django.mo
./frequencyapp/locale/ru/LC_MESSAGES/django.mo
./frequencyapp/locale/ru/LC_MESSAGES/djangojs.mo
./frequencyapp/locale/en/LC_MESSAGES/django.mo
./frequencyapp/locale/en/LC_MESSAGES/djangojs.mo
