#!/bin/sh
docker image prune --force

# optionally update the docker-compose definitions
docker compose down
rm docker compose.override.org.yml || true
rm docker compose.yml || true
wget --no-cache https://raw.githubusercontent.com/temach/jplang/master/moonspeak/docker-compose.override.org.yml
wget --no-cache https://raw.githubusercontent.com/temach/jplang/master/moonspeak/docker-compose.yml
cat docker compose.override.org.yml
cat docker compose.yml

# print the final version
docker compose convert

docker compose pull
docker compose -f docker-compose.yml -f docker-compose.override.org.yml up -d
