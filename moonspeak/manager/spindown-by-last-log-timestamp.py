import docker
import datetime

# Create a Docker client object
client = docker.from_env()

# Get a list of all containers
containers = client.containers.list(all=True)

# Iterate over the containers
for container in containers:
    # Get the logs of the container
    logs = container.logs(tail=1, timestamps=True)
    logs_str = logs.decode()
    logs_list = logs_str.split("\n")
    for log in logs_list:
        if not log:
            continue
        log_time, log_text = log.split(" ",1)
        timestamp = datetime.datetime.strptime(log_time[:19], '%Y-%m-%dT%H:%M:%S')
        # timestamp = datetime.datetime.strptime(log_time, '%Y-%m-%dT%H:%M:%S.%fZ')
        print(f'Container: {container.name} Last Log Timestamp: {timestamp}')

