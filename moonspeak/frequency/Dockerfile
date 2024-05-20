# args are defined in top level docker-compose
ARG BASE_IMAGE

FROM ${BASE_IMAGE} AS base
WORKDIR /opt/moonspeak/

# ffmpeg is necessary to extract audio with wisper
# libgtk-3-dev is necessary for chromium
RUN apt update \
    && apt install -y --no-install-recommends chromium tesseract-ocr tesseract-ocr-jpn ffmpeg libgtk-3-dev \
    && apt clean \
    && rm -rf /var/lib/apt/lists/*  /var/cache/*  /usr/lib/python3*/__pycache__/  /var/tmp/*  /tmp/*

COPY requirements.txt ./
RUN pip install --no-cache-dir --break-system-packages -r requirements.txt

COPY manage.py     ./
COPY runservers.py ./
COPY frequency/     frequency/
COPY frequencyapp/  frequencyapp/


FROM base AS tests
COPY tests/         tests/
ENV DJANGO_SETTINGS_MODULE="frequency.test_settings"
RUN python3 manage.py makemigrations \
    && python3 manage.py migrate \
    && python3 -m unittest discover -v tests


FROM base AS prod
RUN --mount=type=bind,from=tests,target=/dummy,source=/ echo "dummy command to trigger tests during build"
CMD python3 manage.py makemigrations \
    && python3 manage.py migrate \
    && python3 manage.py collectstatic --noinput \
    && python3 manage.py check --deploy \
    && python3 manage.py diffsettings \
    && python3 runservers.py
