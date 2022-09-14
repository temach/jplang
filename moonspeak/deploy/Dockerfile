FROM alpine:latest
WORKDIR /opt/ms/

# some ansible modules (cffi) have compiled dependencies, via pip we need compiler tools
# easier to install the package through system tools instead of compiling ourselves
RUN apk update \
    && apk --no-cache --update add python3 ansible-core py3-pip

RUN apk --no-cache --update add py3-lxml

RUN mkdir backend
COPY backend/requirements.txt ./
RUN pip install -r ./requirements.txt

# becasue we use ansible-core, not ansible, we must install docker_container module by hand
RUN ansible-galaxy collection install community.docker

# add sudo package so run.sh can be executed unmodified on host and in container
RUN apk --no-cache --update add nginx sudo

COPY resources/ resources/

COPY backend/run.sh backend/run.sh
COPY backend/nginx.conf backend/nginx.conf
COPY backend/main.py backend/main.py

WORKDIR /opt/ms/backend
CMD ["/bin/sh", "run.sh"]
