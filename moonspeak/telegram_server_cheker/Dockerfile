FROM python
WORKDIR /opt/moonspeak/telegram_server_cheker

COPY backend/requirements.txt      requirements.txt
COPY backend/main.py      backend/main.py

RUN pip install -r requirements.txt
WORKDIR /opt/moonspeak/telegram_server_cheker/backend
CMD ["python", "main.py"]