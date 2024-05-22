FROM debian:bookworm-slim

WORKDIR /opt/moonspeak/

# byte code helps load source files into memory faster (its byte code not ascii), but after loading the speed is the same
ENV PYTHONDONTWRITEBYTECODE="1"

RUN apt update \
    && apt install -y --no-install-recommends python3 wget ca-certificates apache2 libapache2-mod-auth-openidc libapache2-mod-wsgi-py3 \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /var/cache/*

RUN wget https://bootstrap.pypa.io/get-pip.py \
    && python3 get-pip.py --break-system-packages \
    && rm -rf ~/.cache/*

# install it into /opt/ dir because apache config must specify fullpath
# see: https://opentelemetry.io/blog/2022/instrument-apache-httpd-server/#installing-opentelemetry-module-in-target-system
RUN wget https://github.com/open-telemetry/opentelemetry-cpp-contrib/releases/download/webserver%2Fv1.1.0/opentelemetry-webserver-sdk-x64-linux.tgz \
    && tar -xvf opentelemetry-webserver-sdk-x64-linux.tgz -C /opt \
    && rm opentelemetry-webserver-sdk-x64-linux.tgz \
    && cd /opt/opentelemetry-webserver-sdk  \
    && ./install.sh
ENV LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/opt/opentelemetry-webserver-sdk/sdk_lib/lib

# must chown all files as www-data user, otherwise apache will not read

# make the userdata dir and make it accessible to apache's www-data user
RUN mkdir userdata && chown -R www-data:www-data userdata

# add apache config, this should be included in each project config
COPY --chown=www-data apache_docker.conf    /opt/moonspeak/apache_docker.conf

# force python to use unbuffered output, important else exception traceback can remain invisible
ENV PYTHONUNBUFFERED="1"

CMD ["/bin/bash"]
