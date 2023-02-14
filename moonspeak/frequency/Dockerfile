FROM python:3.10-alpine
WORKDIR /opt/ms/

RUN mkdir userdata

RUN mkdir backend
COPY backend/requirements.txt ./
RUN pip install -r ./requirements.txt

COPY frontend    frontend

COPY backend/main.py backend/main.py
COPY resources   resources

WORKDIR /opt/ms/backend
CMD ["python", "main.py"]
