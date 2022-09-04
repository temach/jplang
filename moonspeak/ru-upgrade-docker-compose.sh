#!/bin/sh
docker image prune --force

# optionally update the docker-compose definitions
docker-compose down
rm docker-compose.override.ru.yml 
rm docker-compose.yml 
wget --no-cache https://raw.githubusercontent.com/temach/jplang/master/moonspeak/docker-compose.override.ru.yml
wget --no-cache https://raw.githubusercontent.com/temach/jplang/master/moonspeak/docker-compose.yml
cat docker-compose.override.ru.yml 
cat docker-compose.yml 

docker-compose pull
docker-compose -f docker-compose.yml -f docker-compose.override.ru.yml up -d
