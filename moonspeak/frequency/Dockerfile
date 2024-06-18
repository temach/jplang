# args are defined in top level docker-compose
ARG BASE_IMAGE

FROM ${BASE_IMAGE} AS base
WORKDIR /opt/moonspeak/

# ffmpeg is necessary to extract audio with wisper
# libgtk-3-dev is necessary for chromium
# chromium dependencies see also: https://github.com/puppeteer/puppeteer/tree/533f83af5a33f9480fce7821140bc50b1b5e511f/docker
RUN apt update \
    && apt install -y --no-install-recommends chromium tesseract-ocr tesseract-ocr-jpn ffmpeg libgtk-3-dev \
    && apt clean \
    && rm -rf /var/lib/apt/lists/*  /var/cache/*  \
    && py3clean /

COPY frequency/requirements.txt ./
RUN pip install --no-cache-dir --break-system-packages -r requirements.txt && py3clean /

USER www-data

# download whisper "base" model to ~/.cache/whisper/base.pt
RUN python3 -c "import whisper; whisper.load_model('base')" && py3clean /

COPY --chown=www-data openapi.yaml   ./
COPY --chown=www-data manage.py      ./
COPY --chown=www-data frequency/     frequency/
COPY --chown=www-data frequencyapp/  frequencyapp/


FROM base AS tests
RUN pip install --no-cache-dir --break-system-packages schemathesis
COPY --chown=www-data tests/ tests/
# use testing settings and rm general settings to ensure they are not mixed up
ENV DJANGO_SETTINGS_MODULE="frequency.test_settings"
RUN rm frequency/settings.py
RUN python3 manage.py migrate
RUN python3 -m unittest discover -v tests
CMD trap 'exit 0' TERM INT; sleep infinity & wait


FROM base AS prod
RUN --mount=type=bind,from=tests,target=/dummy,source=/mnt echo "dummy command creates dependency on tests during docker build"
ENV DJANGO_SETTINGS_MODULE="frequency.settings"
WORKDIR /opt/moonspeak/frequency/
# must create database and static as www-data, but start apache as root
USER root
CMD su www-data -s /bin/bash -c ' \
       python3 ../manage.py migrate \
    && python3 ../manage.py collectstatic --no-input \
    && python3 ../manage.py check --deploy \
    && python3 ../manage.py diffsettings \
    ' \
    && /usr/sbin/apache2 -t -DDUMP_CONFIG -f /opt/moonspeak/frequency/apache.conf \
    && exec /usr/sbin/apache2 -DFOREGROUND -f /opt/moonspeak/frequency/apache.conf
