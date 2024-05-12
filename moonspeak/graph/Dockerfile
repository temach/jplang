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

RUN apt update \
    && apt install -y --no-install-recommends python3 wget ca-certificates apache2 libapache2-mod-auth-openidc libapache2-mod-wsgi-py3 \
		&& rm -rf /var/lib/apt/lists/*
RUN wget https://bootstrap.pypa.io/get-pip.py \
    && python3 get-pip.py --break-system-packages \
    && rm get-pip.py

RUN mkdir backend
COPY backend/requirements.txt ./
RUN pip install --break-system-packages -r ./requirements.txt

# must chown as www-data user, otherwise apache will not access
COPY --chown=www-data --from=builder /opt/moonspeak/build/frontend/src/main/webapp    frontend/src/main/webapp
COPY --chown=www-data --from=builder /opt/moonspeak/build/frontend/apache_oidc_html_error_template.html    frontend/apache_oidc_html_error_template.html

COPY --chown=www-data backend/  backend/
COPY --chown=www-data config/   config/

RUN mkdir userdata && chown www-data:www-data userdata

WORKDIR /opt/moonspeak/backend
# CMD ["python", "main.py"]
CMD ["/usr/sbin/apache2", "-f", "/opt/moonspeak/backend/apache2.conf", "-DFOREGROUND", "-DDUMP_CONFIG"]
