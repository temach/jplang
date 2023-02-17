FROM python:3.10-alpine
WORKDIR /opt/moonspeak/manager

# do not pin package versions for alpine, see: https://gitlab.alpinelinux.org/alpine/abuild/-/issues/9996#note_87135
RUN apk --no-cache --update add docker docker-cli-compose

COPY backend/requirements.txt ./
RUN pip install -r ./requirements.txt

COPY resources/ resources/
COPY frontend/ frontend/
COPY backend/ backend/

WORKDIR /opt/moonspeak/manager/backend
CMD ["python3", "main.py"]
