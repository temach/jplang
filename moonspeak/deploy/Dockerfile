FROM python:alpine
WORKDIR /opt/ms/

RUN mkdir backend
COPY backend/requirements.txt ./
RUN pip install -r ./requirements.txt

COPY backend/main.py backend/main.py

RUN mkdir resources
COPY resources/services.yml resources/services.yml

WORKDIR /opt/ms/backend
CMD ["python", "main.py"]
