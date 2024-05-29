FROM debian:bookworm-slim

WORKDIR /opt/moonspeak/

# byte code helps load source files into memory faster (its byte code not ascii), but after loading the speed is the same
# however .pyc and __pycache__ still get created, so use py3clean script that debian python ships with
ENV PYTHONDONTWRITEBYTECODE="1"

RUN apt update \
    && apt install -y --no-install-recommends python3 wget ca-certificates apache2 libapache2-mod-auth-openidc libapache2-mod-wsgi-py3 \
    && rm -rf /var/lib/apt/lists/*  /var/cache/* \
    && py3clean /

RUN wget https://bootstrap.pypa.io/get-pip.py \
    && python3 get-pip.py --no-cache-dir --break-system-packages \
    && rm get-pip.py \
    && py3clean /

# install it into /opt/ dir because apache config must specify fullpath
# see: https://opentelemetry.io/blog/2022/instrument-apache-httpd-server/#installing-opentelemetry-module-in-target-system
RUN wget https://github.com/open-telemetry/opentelemetry-cpp-contrib/releases/download/webserver%2Fv1.1.0/opentelemetry-webserver-sdk-x64-linux.tgz \
    && tar -xvf opentelemetry-webserver-sdk-x64-linux.tgz -C /opt \
    && rm opentelemetry-webserver-sdk-x64-linux.tgz \
    && cd /opt/opentelemetry-webserver-sdk  \
    && ./install.sh
ENV LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/opt/opentelemetry-webserver-sdk/sdk_lib/lib

# ceremony with "www-data" is necessary:
# - apache really does not like to run as root (only compile time switch)
# - mod_wsgi has built in protections against running as root
# - sqlite3 does not respect umask, causes trouble when db is root owned only, see: https://www.mail-archive.com/sqlite-users@mailinglists.sqlite.org/msg59080.html

# chown dir to allow writing by apache/mod_wsgi
RUN chown -R www-data:www-data $PWD

# fix apache's www-data user HOME dir to the actual working directory, wsgi HOME is taken from /etc/passwd only
# permission problems with docker if HOME is not properly set: https://github.com/docker/compose/issues/11126
# also 'python -c "import & download"' style commands ususally download to $HOME dir, so www-data needs a $HOME
RUN usermod --home $PWD www-data

# gives www-data readonly access to root files
# can not give write access as docker does not support umask, see: https://github.com/moby/moby/issues/19189)
# also necessary when giving access to docker.sock under wsgi
RUN usermod -G root www-data

# make the userdata dir and make it accessible to apache's www-data user
RUN mkdir userdata && chown -R www-data:www-data userdata

# add apache config, this should be included in each project config
COPY --chown=www-data apache_docker.conf    /opt/moonspeak/apache_docker.conf

# force python to use unbuffered output, important else exception traceback can remain invisible
ENV PYTHONUNBUFFERED="1"

# infinite sleep that easily quits on CTRL-C
CMD trap 'exit 0' TERM INT; sleep infinity & wait
