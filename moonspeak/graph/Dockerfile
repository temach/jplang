# args are defined in top level docker-compose
ARG BASE_IMAGE
ARG BUILDER_IMAGE

FROM ${BUILDER_IMAGE} as builder
WORKDIR /opt/moonspeak/build/
RUN apt-get update
RUN apt-get install -y ant
ENV JAVA_TOOL_OPTIONS -Dfile.encoding=UTF8
COPY frontend/ 	frontend/
RUN cd frontend/etc/build && ant app


FROM ${BASE_IMAGE}
WORKDIR /opt/moonspeak/
RUN apt update
RUN apt install -y python3 python3-pip
RUN apt install -y apache2 apache2-utils libapache2-mod-auth-openidc libapache2-mod-wsgi-py3
# fix apache's www-data user HOME dir to the actual working directory, wsgi HOME is taken from /etc/passwd only
# permission problems with docker if HOME is not properly set: https://github.com/docker/compose/issues/11126
RUN usermod --home $PWD www-data

RUN mkdir userdata

RUN mkdir backend
COPY backend/requirements.txt ./
RUN pip install --break-system-packages -r ./requirements.txt

COPY --from=builder /opt/moonspeak/build/frontend    frontend

COPY backend/  backend/
COPY config/   config/

# own all files as www-data user, otherwise apache will not read
RUN chown -R www-data:www-data .

WORKDIR /opt/moonspeak/backend
# CMD ["python", "main.py"]
CMD ["/usr/sbin/apache2", "-f", "/opt/moonspeak/backend/apache2.conf", "-DFOREGROUND", "-DMOONSPEAK_DOCKER_MODE", "-DDUMP_CONFIG"]
