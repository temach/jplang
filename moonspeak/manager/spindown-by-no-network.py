import docker

# Create a Docker client object
client = docker.from_env()

# Get a list of all containers
containers = client.containers.list(all=True)

# Filter out containers that did not receive any network requests
idle_containers = [container for container in containers if container.attrs['NetworkSettings']['Networks']['bridge']['RxBytes'] == 0]

# Print the names of the idle containers
for container in idle_containers:
    print(container.name)
