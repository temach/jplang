FROM python
WORKDIR /opt/moonspeak/telegram_server_cheker

COPY backend/requirements.txt      requirements.txt
RUN pip install -r requirements.txt
COPY backend/main.py      backend/main.py

WORKDIR /opt/moonspeak/telegram_server_cheker/backend
CMD ["python", "main.py"]