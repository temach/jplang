FROM node as builder

WORKDIR /opt/ms

RUN npm install --global gulp-cli
COPY frontend/package.json           .
COPY frontend/package-lock.json      .
RUN npm install

COPY frontend       frontend
COPY gulpfile.js    .
RUN gulp


FROM python:alpine
WORKDIR /opt/ms/

RUN mkdir tmp

RUN mkdir backend

RUN pip install nltk==3.7
COPY backend/download_libs.py   download_libs.py
RUN python ./download_libs.py

COPY backend/requirements.txt   requirements.txt
RUN pip install -r requirements.txt

COPY resources resources

COPY --from=builder /opt/ms/dist frontend

COPY backend/main.py            backend/main.py
COPY backend/gunicorn.conf.py   backend/gunicorn.conf.py

WORKDIR /opt/ms/backend
CMD ["python", "main.py"]
