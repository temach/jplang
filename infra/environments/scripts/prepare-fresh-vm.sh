#!/bin/sh
sudo apt update
sudo apt upgrade
sudo apt install docker.io

# https://docs.docker.com/compose/install/standalone/
curl -SL 'https://github.com/docker/compose/releases/download/v2.26.1/docker-compose-linux-x86_64' -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

adduser moonspeak
usermod -a -G sudo moonspeak
usermod -a -G docker moonspeak

# ssh-copy-id moonspeak@188.212.124.182 -p 2222

# vi /etc/ssh/sshd_config
#   Port 2222
#   PermitRootLogin no
#   PasswordAuthentication no
# systemctl restart ssh
