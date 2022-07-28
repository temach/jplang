FROM sebp/lighttpd:latest
ENV PORT=80
WORKDIR /etc/lighttpd/

COPY lighttpd.conf                      .
COPY set_moonspeak_hud_config_json.sh   .
COPY frontend/                          frontend/
