FROM node as builder

WORKDIR /opt/moonspeak/build/frontend

RUN npm install --global gulp-cli
COPY frontend/package.json           package.json
COPY frontend/package-lock.json      package-lock.json
RUN npm install

COPY frontend/src           src
COPY frontend/elm           elm
COPY frontend/gulpfile.js   gulpfile.js
RUN gulp production


FROM python:alpine
WORKDIR /opt/moonspeak/suggestions

# dependencies
COPY backend/requirements.txt       requirements.txt
RUN pip install -r requirements.txt

# data resources
COPY resources          resources

# code
COPY --from=builder /opt/moonspeak/build/frontend/dist    frontend/dist

COPY backend/main.py            backend/main.py

# command
WORKDIR /opt/moonspeak/suggestions/backend
CMD ["python", "main.py"]
