FROM python:alpine
WORKDIR /opt/ms/

RUN mkdir tmp

RUN mkdir backend
COPY backend/requirements.txt ./
RUN pip install -r ./requirements.txt

COPY frontend frontend

COPY backend/main.py backend/main.py

WORKDIR /opt/ms/backend
CMD ["python", "main.py"]
