# Multistage build: first the frontend, then move to backend container

FROM debian:11 as builder

WORKDIR /opt/moonspeak/build/

RUN apt-get update
RUN apt-get install -y ant

ENV JAVA_TOOL_OPTIONS -Dfile.encoding=UTF8

COPY frontend 	frontend

RUN cd frontend/etc/build && ant app


FROM debian:bookworm-slim
WORKDIR /opt/moonspeak/graph/

RUN apt update
RUN apt install -y python3 python3-pip
RUN apt install -y apache2 apache2-utils
RUN apt install -y libapache2-mod-auth-openidc
RUN apt install -y libapache2-mod-wsgi-py3

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
CMD ["/usr/sbin/apache2", "-f", "/opt/moonspeak/graph/backend/apache2.conf", "-D", "FOREGROUND", "-D", "MOONSPEAK_DOCKER_MODE", "-D", "DUMP_CONFIG"]
