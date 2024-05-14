FROM debian:bookworm-slim

WORKDIR /opt/moonspeak/

RUN apt update \
    && apt install -y --no-install-recommends python3 wget ca-certificates apache2 libapache2-mod-auth-openidc libapache2-mod-wsgi-py3 \
    && rm -rf /var/lib/apt/lists/*  /var/cache/*  /usr/lib/python3*/__pycache__/

RUN wget https://bootstrap.pypa.io/get-pip.py \
    && python3 get-pip.py --break-system-packages \
    && rm -rf ~/.cache/*

# must chown all files as www-data user, otherwise apache will not read

# make the userdata dir and make it accessible to apache's www-data user
RUN mkdir userdata && chown -R www-data:www-data userdata

# add apache config, this should be included in each project config
COPY --chown=www-data apache_docker.conf    /opt/moonspeak/apache_docker.conf

CMD ["/bin/bash"]
