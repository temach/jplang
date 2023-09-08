FROM python:3.11-bookworm
WORKDIR /frequency

#libraries for the correct operation of chromium from 
#https://ahelpme.com/linux/ubuntu/chromium-browser-in-ubuntu-20-04-lts-without-snap-to-use-in-docker-container/

RUN apt-key adv --fetch-keys "https://keyserver.ubuntu.com/pks/lookup?op=get&search=0xea6e302dc78cc4b087cfc3570ebea9b02842f111" \
&& echo 'deb http://ppa.launchpad.net/chromium-team/beta/ubuntu bionic main ' >> /etc/apt/sources.list.d/chromium-team-beta.list \
&& apt update
RUN export DEBIAN_FRONTEND=noninteractive \
&& export DEBCONF_NONINTERACTIVE_SEEN=true \
&& apt-get -y install chromium-browser

RUN apt-get update && apt-get install -y tesseract-ocr
RUN apt-get install -y tesseract-ocr-jpn

COPY /frequencyapp/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# to extract audio for whisper
RUN apt-get install -y ffmpeg
# to run chromium
RUN apt-get install -y libgtk-3-dev

COPY . .
RUN python manage.py makemigrations
RUN python manage.py migrate
RUN python -m unittest discover -v tests
CMD ["python", "manage.py", "runserver", "--noreload", "--nothreading", "0.0.0.0:8005"]