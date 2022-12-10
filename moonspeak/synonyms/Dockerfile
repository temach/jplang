FROM node:19.2 as builder

WORKDIR /opt/moonspeak/build/frontend

RUN npm install --global gulp-cli@2.3.0
COPY frontend/package.json           package.json
COPY frontend/package-lock.json      package-lock.json
RUN npm install

COPY frontend/src           src
COPY frontend/elm           elm
COPY frontend/gulpfile.js   gulpfile.js

RUN gulp production


FROM python:3.10-alpine
WORKDIR /opt/moonspeak/synonyms

# dependencies
COPY backend/requirements.txt       requirements.txt
RUN pip install -r requirements.txt

RUN python -c "import nltk; nltk.download('wordnet');"

# data resources
COPY resources          resources

# code
COPY --from=builder /opt/moonspeak/build/frontend/dist       frontend/dist

COPY backend/main.py            backend/main.py
COPY backend/gunicorn.conf.py   backend/gunicorn.conf.py

# command
WORKDIR /opt/moonspeak/synonyms/backend
CMD ["python", "main.py"]
