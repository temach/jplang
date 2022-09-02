FROM node as builder

WORKDIR /opt/moonspeak/build/frontend

RUN npm install --global gulp-cli
COPY frontend/package.json           package.json
COPY frontend/package-lock.json      package-lock.json
RUN npm install

COPY frontend/src           src
COPY frontend/gulpfile.js   gulpfile.js

RUN gulp production


FROM sebp/lighttpd:latest

# the base images has "VOLUME /etc/lighttpd"
# which creates anon volume for configuration
# this means to change config you must each time renew-anon-volumes
# its annoying, so avoid using /etc/lighttpd dir altogether

ENV MOONSPEAK_PORT=80
WORKDIR /opt/moonspeak/hud

COPY mime-types.conf                    mime-types.conf
COPY lighttpd.conf                      lighttpd.conf
COPY set_moonspeak_hud_config_json.sh   set_moonspeak_hud_config_json.sh

COPY --from=builder /opt/moonspeak/build/frontend/dist       frontend/dist

CMD ["lighttpd", "-D", "-f", "lighttpd.conf"]
