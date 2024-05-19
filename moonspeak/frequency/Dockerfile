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

COPY manage.py     ./manage.py
COPY frequency     ./frequency
COPY frequencyapp  ./frequencyapp

CMD sh -c "python3 manage.py makemigrations && \
           python3 manage.py migrate && \
           python3 manage.py collectstatic --noinput && \
           python3 manage.py check --deploy && \
           python3 manage.py diffsettings && \
           python3 manage.py runserver --noreload --nothreading 0.0.0.0:80"
