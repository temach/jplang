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

# dependencies
COPY backend/requirements.txt  ./
RUN pip install --no-cache-dir --break-system-packages -r requirements.txt && py3clean /

# own all files as www-data user, otherwise apache will not read
COPY --chown=www-data resources           resources
COPY --chown=www-data --from=builder /opt/moonspeak/build/frontend/dist       frontend/dist
COPY --chown=www-data backend             backend

WORKDIR /opt/moonspeak/backend
# CMD ["python", "main.py"]
CMD /usr/sbin/apache2 -t -DDUMP_CONFIG -f /opt/moonspeak/backend/apache.conf && /usr/sbin/apache2 -DFOREGROUND -f /opt/moonspeak/backend/apache.conf
