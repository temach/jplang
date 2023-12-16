FROM debian:bookworm-slim
WORKDIR /opt/moonspeak/
RUN apt update
RUN apt install -y python3 python3-pip
RUN apt install -y apache2 apache2-utils libapache2-mod-auth-openidc libapache2-mod-wsgi-py3
# fix apache's www-data user HOME dir to the actual working directory, wsgi HOME is taken from /etc/passwd only
# permission problems with docker if HOME is not properly set: https://github.com/docker/compose/issues/11126
RUN usermod --home $PWD www-data

# install docker client and compose plugin: https://docs.docker.com/engine/install/debian/#install-from-a-package
ADD "https://download.docker.com/linux/debian/dists/bookworm/pool/stable/amd64/docker-ce-cli_24.0.7-1~debian.12~bookworm_amd64.deb" /opt/docker/
ADD "https://download.docker.com/linux/debian/dists/bookworm/pool/stable/amd64/docker-compose-plugin_2.21.0-1~debian.12~bookworm_amd64.deb" /opt/docker/
RUN dpkg -i /opt/docker/docker-*
# must make www-data equivalent to root, to give access to docker.sock under wsgi
RUN usermod -G root www-data

RUN mkdir backend
COPY backend/requirements.txt ./
RUN pip install --break-system-packages -r ./requirements.txt

COPY resources/ resources/
COPY frontend/ frontend/
COPY backend/ backend/

# own all files as www-data user, otherwise apache will not read
RUN chown -R www-data:www-data .

WORKDIR /opt/moonspeak/backend
# CMD ["python", "main.py"]
CMD ["/usr/sbin/apache2", "-f", "/opt/moonspeak/backend/apache2.conf", "-DFOREGROUND", "-DMOONSPEAK_DOCKER_MODE", "-DDUMP_CONFIG"]
