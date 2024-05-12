# args are defined in top level docker-compose
ARG BASE_IMAGE

FROM ${BASE_IMAGE}

RUN apt update \
    && apt install -y --no-install-recommends python3 wget ca-certificates apache2 libapache2-mod-auth-openidc libapache2-mod-wsgi-py3 \
    && rm -rf /var/lib/apt/lists/*  /var/cache/*  /usr/lib/python3*/__pycache__/
RUN wget https://bootstrap.pypa.io/get-pip.py \
    && python3 get-pip.py --break-system-packages \
    && rm -rf ~/.cache/*

# fix apache's www-data user HOME dir to the actual working directory, wsgi HOME is taken from /etc/passwd only
# permission problems with docker if HOME is not properly set: https://github.com/docker/compose/issues/11126
RUN usermod --home $PWD www-data

# install docker client and compose plugin: https://docs.docker.com/engine/install/debian/#install-from-a-package
WORKDIR /opt/docker
RUN wget "https://download.docker.com/linux/debian/dists/bookworm/pool/stable/amd64/docker-ce-cli_24.0.7-1~debian.12~bookworm_amd64.deb" \
    && wget "https://download.docker.com/linux/debian/dists/bookworm/pool/stable/amd64/docker-compose-plugin_2.21.0-1~debian.12~bookworm_amd64.deb" \
    && dpkg -i /opt/docker/docker-* \
    && rm -rf /opt/docker/docker-*

# must make www-data equivalent to root, to give access to docker.sock under wsgi
RUN usermod -G root www-data

WORKDIR /opt/moonspeak

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir --break-system-packages -r ./requirements.txt

# own all files as www-data user, otherwise apache will not read
COPY --chown=www-data resources/ resources/
COPY --chown=www-data frontend/ frontend/
COPY --chown=www-data backend/ backend/

WORKDIR /opt/moonspeak/backend
# CMD ["python", "main.py"]
CMD ["/usr/sbin/apache2", "-f", "/opt/moonspeak/backend/apache2.conf", "-DFOREGROUND", "-DDUMP_CONFIG"]
