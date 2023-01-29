FROM alpine:3.17
WORKDIR /opt/moonspeak/manager

RUN apk update \
    && apk --no-cache --update add python3 py3-pip py3-lxml

# add sudo package so run.sh can be executed unmodified on host and in container
RUN apk --no-cache --update add nginx sudo

RUN apk --no-cache --update add docker

WORKDIR /opt/moonspeak/manager/backend
COPY backend/requirements.txt ./
RUN pip install -r ./requirements.txt

WORKDIR /opt/moonspeak/manager
COPY resources/ resources/

COPY backend/main.py backend/main.py

WORKDIR /opt/moonspeak/manager/backend
CMD ["python3", "main.py"]
