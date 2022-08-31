FROM node as builder

WORKDIR /opt/moonspeak/synonyms/frontend

RUN npm install --global gulp-cli
COPY frontend/package.json           package.json
COPY frontend/package-lock.json      package-lock.json
RUN npm install

COPY frontend/src           src
COPY frontend/elm           elm
COPY frontend/gulpfile.js   gulpfile.js
RUN gulp


FROM python:alpine
WORKDIR /opt/moonspeak/synonyms

# dependencies
RUN pip install nltk==3.7
RUN python -c "import nltk; nltk.download('wordnet');"

COPY backend/requirements.txt       requirements.txt
RUN pip install -r requirements.txt

# data resources
COPY resources          resources

# code
COPY --from=builder /opt/moonspeak/synonyms/frontend/dist    frontend/dist

COPY backend/main.py            backend/main.py
COPY backend/gunicorn.conf.py   backend/gunicorn.conf.py

# command
WORKDIR /opt/moonspeak/synonyms/backend
CMD ["python", "main.py"]
