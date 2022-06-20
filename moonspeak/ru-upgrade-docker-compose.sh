#!/bin/sh
sudo docker image prune --force

# optionally update the docker-compose definitions
# sudo docker-compose down
# rm docker-compose.override.ru.yml 
# rm docker-compose.yml 
# wget https://raw.githubusercontent.com/temach/jplang/master/moonspeak/docker-compose.override.ru.yml
# wget https://raw.githubusercontent.com/temach/jplang/master/moonspeak/docker-compose.yml
# cat docker-compose.override.ru.yml 
# cat docker-compose.yml 

sudo docker-compose pull
sudo docker-compose -f docker-compose.yml -f docker-compose.override.ru.yml up -d
