To run a new user manually, do the following

Note: using `-p PROJECT_NAME` to docker compose is very important.
```
# pip install jinja2-cli
# jinja2 docker-compose.jinja-template.yml > docker-compose.user-demouser2.yml
# docker-compose -f docker-compose.user-demouser2.yml -p user-demouser2 up

...

# docker-compose -f docker-compose.user-demouser2.yml -p user-demouser2 down
```


Right now we use Python on whales project which needs "docker compose" (note: NOT the old "docker-compose", but the new "docker compose" without the hyphen)
To install it on ubuntu see: https://github.com/docker/compose/tree/v2#linux

In short:
```
You can download Docker Compose binaries from the release (https://github.com/docker/compose/releases) page on this repository.

Rename the relevant binary for your OS to "docker-compose" and copy it to $HOME/.docker/cli-plugins

Make the downloaded file executable with chmod +x
```


Different approaches to spinning down the containers:
- Queries container via URL: https://spin-docker.readthedocs.io/en/latest/activity_monitoring.html#stopping-idle-containers-example-workflow
- Proxy in front of nginx to count URL requests (can start and stop): https://github.com/girishso/autosleep
- Monitor Net and disk IO from docker: https://www.datadoghq.com/blog/how-to-monitor-docker-resource-metrics/


Maybe monitor Net and disk IO every few minutes and once a suspect idle container is located check router logs to see that its not doing anything?
Maybe just check each container's logs all requests should produce at least one line right?
