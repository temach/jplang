# args are defined in top level docker-compose
ARG BASE_IMAGE

FROM ${BASE_IMAGE}
WORKDIR /opt/moonspeak/frequency

RUN apt update \
    && apt install -y --no-install-recommends chromium tesseract-ocr tesseract-ocr-jpn ffmpeg libgtk-3-dev \
    && apt clean \
    && rm -rf /var/lib/apt/lists/*  /var/cache/*  /usr/lib/python3*/__pycache__/  /var/tmp/*  /tmp/*

COPY requirements.txt ./
RUN pip install --no-cache-dir --break-system-packages -r requirements.txt

# ffmpeg is necessary to extract audio with wisper
# libgtk-3-dev is necessary for chromium

COPY manage.py     ./manage.py
COPY runservers.py ./runservers.py
COPY frequency     ./frequency
COPY frequencyapp  ./frequencyapp

# here makemigrations will work because we use test_settings.py which does not rely on env variables
# but tained database will be left in the docker image ??
RUN sh -c "python3 manage.py makemigrations && \
           python3 manage.py migrate && \
					 python3 -m unittest discover -v tests"

CMD sh -c "python3 manage.py makemigrations && \
           python3 manage.py migrate && \
           python3 manage.py collectstatic --noinput && \
           python3 manage.py check --deploy && \
           python3 manage.py diffsettings && \
           python3 runservers.py"
