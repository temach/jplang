# args are defined in top level docker-compose
ARG BASE_IMAGE
ARG BUILDER_IMAGE

FROM ${BUILDER_IMAGE} as builder

WORKDIR /opt/moonspeak/build/frontend

RUN npm install --global gulp-cli@2.3.0
COPY frontend/package.json           package.json
COPY frontend/package-lock.json      package-lock.json
RUN npm install

COPY frontend/src           src
COPY frontend/elm           elm
COPY frontend/gulpfile.js   gulpfile.js

RUN gulp production


FROM ${BASE_IMAGE}
WORKDIR /opt/moonspeak/

RUN apt update \
    && apt install -y --no-install-recommends python3 wget ca-certificates apache2 libapache2-mod-auth-openidc libapache2-mod-wsgi-py3 \
		&& rm -rf /var/lib/apt/lists/*
RUN wget https://bootstrap.pypa.io/get-pip.py \
    && python3 get-pip.py --break-system-packages \
    && rm get-pip.py

# dependencies
COPY backend/requirements.txt  ./
RUN pip install --break-system-packages -r requirements.txt
RUN python3 -c "import nltk; nltk.download('wordnet');"

# code
COPY --chown=www-data resources/       resources/
COPY --from=builder /opt/moonspeak/build/frontend/dist       frontend/dist
COPY backend/ backend/

# own all files as www-data user, otherwise apache will not read
RUN chown -R www-data:www-data .

# command
WORKDIR /opt/moonspeak/backend
CMD ["python3", "main.py"]
# CMD ["/usr/sbin/apache2", "-f", "/opt/moonspeak/backend/apache2.conf", "-DFOREGROUND", "-DDUMP_CONFIG"]
