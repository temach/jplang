#!/bin/sh
sudo docker-compose pull
sudo docker-compose -f docker-compose.yml -f docker-compose.override.ru.yml up -d
sudo docker image prune --force
