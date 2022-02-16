FROM python:buster
WORKDIR /opt/ms/

RUN mkdir tmp

RUN mkdir backend
COPY backend/requirements.txt ./
RUN pip install -r ./requirements.txt

COPY resources resources

RUN mkdir frontend
COPY frontend/static frontend/static

COPY backend/main.py backend/main.py

WORKDIR /opt/ms/backend
CMD ["python", "main.py"]
