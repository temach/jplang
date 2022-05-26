FROM python:alpine
WORKDIR /root/

# dependencies
COPY backend/requirements.txt   ./backend/
RUN pip install -r backend/requirements.txt

# data resources
COPY resources                  ./resources

# code
COPY frontend/index.html        ./frontend/
COPY frontend/static/*          ./frontend/static/
COPY backend/main.py            ./backend/

# command
WORKDIR /root/backend/
CMD ["python", "main.py"]
