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

COPY resources/ resources/

COPY backend/main.py backend/main.py

WORKDIR /opt/ms/backend
CMD ["python3", "main.py"]
