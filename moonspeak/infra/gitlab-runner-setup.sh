#!/bin/sh

# installing a runner: https://docs.gitlab.com/runner/install/docker.html
# registering a runner: https://docs.gitlab.com/runner/register/
# runner config.toml docs: https://docs.gitlab.com/runner/configuration/advanced-configuration.html
# runner config.toml path: /etc/gitlab-runner/config.toml

# to build images when inside container, use podman like gitlab shows with buildah/kaniko:
# - avoids docker-in-docker
# - avoids running priviledged build containers

set -e

docker volume create gitlab-runner-config

docker run -d --name gitlab-runner --restart always \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v gitlab-runner-config:/etc/gitlab-runner \
    --memory=300m --cpus="0.5" \
    gitlab/gitlab-runner:latest

# Register runner manually:
# docker run --rm -it -v gitlab-runner-config:/etc/gitlab-runner gitlab/gitlab-runner:latest register --url https://gitlab.com --token XYZ
#
# Edit runner config manually (docker cp config to host, edit, cp back and restart gitlab-runner):
#     privileged = false
#     volumes = ["/var/run/docker.sock:/var/run/docker.sock", "/cache"]
