FROM python
WORKDIR /root/

# dependencies
COPY backend/requirements.txt   ./backend/
RUN pip install -r backend/requirements.txt

# data resources
COPY resources                  ./resources

# code
COPY frontend/index.html        ./frontend
COPY backend/main.py            ./backend/  

# command
CMD ["python", "backend/main.py"]
