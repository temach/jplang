FROM debian:bookworm-slim

RUN apt update \
    && apt install -y --no-install-recommends wget ca-certificates openssh-server \
    && rm -rf /var/lib/apt/lists/*  /var/cache/*

RUN wget https://github.com/getsops/sops/releases/download/v3.8.1/sops-v3.8.1.linux.amd64 && \
    mv sops*.amd64 /usr/local/bin/sops && \
    chmod +x /usr/local/bin/sops

# sshd needs this on first run
RUN mkdir /run/sshd

# shown during ssh login, motd lists instructions how to configure ssh client
# to use sops keyservice via ssh tunneling while interactive login is banned on kms server
COPY ./etc-motd       /etc/motd

RUN adduser --disabled-password --gecos "" --shell /usr/sbin/nologin kms
COPY --chown=kms --chmod=700 kms /home/kms


# also consider restricted bash shell, see: https://www.gnu.org/software/bash/manual/html_node/The-Restricted-Shell.html
COPY ./entrypoint.sh  /entrypoint.sh
CMD rm -f /home/kms/.ssh/sops.sock && exec /entrypoint.sh
