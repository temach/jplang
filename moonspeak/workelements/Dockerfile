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
WORKDIR /opt/moonspeak/workelements

RUN mkdir userdata

# dependencies
# libgcc is necessary for pyruvate runtime
RUN apk add libgcc
COPY backend/requirements_prod.txt       requirements.txt
RUN pip install -r requirements.txt

# data resources
COPY resources          resources

# code
COPY --from=builder /opt/moonspeak/build/frontend/dist       frontend/dist

COPY backend/main.py            backend/main.py

WORKDIR /opt/moonspeak/workelements/backend
CMD ["python", "main.py"]
