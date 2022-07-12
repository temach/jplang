#!/bin/sh

# see: https://eff-certbot.readthedocs.io/en/stable/install.html#running-with-docker

docker-compose down

# create certificate with this:
# docker run -it --rm --name certbot -v "/etc/letsencrypt:/etc/letsencrypt" -v "/var/lib/letsencrypt:/var/lib/letsencrypt" -p 80:80 certbot/certbot certonly

# renew certificate with this:
docker run -it --rm --name certbot -v "/etc/letsencrypt:/etc/letsencrypt" -v "/var/lib/letsencrypt:/var/lib/letsencrypt" -p 80:80 certbot/certbot renew --force-renewal

docker-compose -f docker-compose.yml -f docker-compose.override.ru.yml up -d
