FROM python:alpine
WORKDIR /opt/ms/

RUN mkdir backend
COPY backend/requirements.txt ./
RUN pip install -r ./requirements.txt

COPY backend/bottle.py backend/bottle.py
COPY backend/main.py backend/main.py

WORKDIR /opt/ms/backend
CMD ["python", "main.py"]
