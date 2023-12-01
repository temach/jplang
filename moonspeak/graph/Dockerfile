# openjdk container is for alpha java releases only, so we use an alternative openjdk build
# FROM eclipse-temurin:19-jre-jammy as builder
# FROM ubuntu:jammy-20221130 as builder

# faced an issue after bundling mermaid.js: Uncaught SyntaxError: Invalid regular expression: /???????/: Nothing to repeat
# solution was to use the same docker base image, as used by drawio itself: https://github.com/jgraph/docker-drawio/blob/dev/main/Dockerfile
# see also: https://github.com/docker-library/openjdk/issues/32
# FROM openjdk:11-jdk-slim AS build
# 
# RUN apt-get update -y && \
# # this solves some weird issue with openjdk-11-jdk-headless
# # https://github.com/nextcloud/docker/issues/380
#     mkdir -p /usr/share/man/man1 && \
#     apt-get install -y \
#         ant \
#         git
# 
# WORKDIR /opt/moonspeak/build/

FROM debian:11 as builder

WORKDIR /opt/moonspeak/build/

RUN apt-get update
RUN apt-get install -y ant

ENV JAVA_TOOL_OPTIONS -Dfile.encoding=UTF8

COPY frontend 	frontend

RUN cd frontend/etc/build && ant app


FROM debian:bookworm-slim
RUN apt update
RUN apt install -y python3 python3-pip

WORKDIR /opt/moonspeak/graph/

RUN apt install -y apache2 apache2-utils
# see: https://github.com/OpenIDC/mod_auth_openidc#quickstart-with-a-generic-openid-connect-provider
RUN apt install -y libapache2-mod-auth-openidc
RUN apt install -y libapache2-mod-wsgi-py3
# alternative to apt install from official mod_wsgi docs:
# RUN pip3 install mod_wsgi --break-system-packages
# RUN export MOD_WSGI_PATH=$(mod_wsgi-express module-location)

RUN mkdir userdata

RUN mkdir backend
COPY backend/requirements.txt ./
RUN pip install --break-system-packages -r ./requirements.txt

COPY --from=builder /opt/moonspeak/build/frontend    frontend

COPY backend/*  backend/
COPY config   config

# own all files as www-data user, otherwise apache will not read
RUN chown -R www-data:www-data .

WORKDIR /opt/moonspeak/graph/backend
# CMD ["python", "main.py"]
CMD ["apachectl", "-f", "/opt/moonspeak/graph/backend/apache2.conf", "-D", "FOREGROUND", "-D", "MOONSPEAK_DOCKER"]
