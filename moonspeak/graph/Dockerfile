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


FROM python:3.10-alpine
WORKDIR /opt/ms/

RUN mkdir tmp

RUN mkdir backend
COPY backend/requirements.txt ./
RUN pip install -r ./requirements.txt

COPY --from=builder /opt/moonspeak/build/frontend    frontend

COPY backend/main.py backend/main.py
COPY config   config

WORKDIR /opt/ms/backend
CMD ["python", "main.py"]
