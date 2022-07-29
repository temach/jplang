FROM sebp/lighttpd:latest

# the base images has "VOLUME /etc/lighttpd"
# which creates anon volume for configuration
# this means to change config you must each time renew-anon-volumes
# its annoying, so avoid using /etc/lighttpd dir altogether

ENV MOONSPEAK_PORT=80
WORKDIR /opt/ms

COPY mime-types.conf                    .
COPY lighttpd.conf                      .
COPY set_moonspeak_hud_config_json.sh   .
COPY frontend/                          frontend/

CMD ["lighttpd", "-D", "-f", "/opt/ms/lighttpd.conf"]
