#
# read the official multiprocessing guidelines: https://docs.python.org/3/library/multiprocessing.html#programming-guidelines
# docker compose logs are always in UTC, so all the times here should be in UTC
#

def spindown_process(event_queue):
    import re
    import os
    import multiprocessing
    from datetime import datetime, timedelta
    from queue import Empty, Full
    from urllib.parse import urlparse
    from pathlib import Path

    import docker
    from python_on_whales import DockerClient
    from python_on_whales.exceptions import DockerException

    IGNORED_DEMO_USER = os.getenv("MOONSPEAK_IGNORED_DEMO_USER", "demouser1")

    SECONDS_BEFORE_IDLE_SPINDOWN = int(os.getenv("MOONSPEAK_SECONDS_BEFORE_IDLE_SPINDOWN", "90"))
    MAX_INTERVAL_DURATION_SECONDS = int(os.getenv("MOONSPEAK_MAX_INTERVAL_DURATION_SECONDS", "30"))  # must check at least once in this interval
    MIN_INTERVAL_DURATION_SECONDS = int(os.getenv("MOONSPEAK_MIN_INTERVAL_DURATION_SECONDS", "10"))  # never check more often than this interval

    FORCE_STOP_TIMEOUT = 15

    # logging inherits level from parent process, see: https://docs.python.org/3/library/multiprocessing.html#logging
    logger = multiprocessing.log_to_stderr()

    # Create a Docker client object
    client = docker.from_env()

    # regex: start from "u-" and take everything until a literal [.] or [-]
    re_user_name = re.compile("^u-([^.-]+)")
    latest_check_timestamp = datetime.utcnow()

    min_interval_duration = timedelta(seconds=MIN_INTERVAL_DURATION_SECONDS)
    seconds_before_idle = timedelta(seconds=SECONDS_BEFORE_IDLE_SPINDOWN)
    logger.debug(f"Seconds before considered idle is {seconds_before_idle}")

    # must check at least once during MAX_INTERVAL_DURATION_SECONDS (e.g. once a minute)
    # never check more often than every MIN_INTERVAL_DURATION_SECONDS (e.g. dont check 10 times per second)
    # if event arrives then try to do a check
    while True:
        logger.debug(f"Waiting on queue for {MAX_INTERVAL_DURATION_SECONDS} seconds...")
        try:
            # either there is event in queue or its timeout and we wake up
            data = event_queue.get(timeout=MAX_INTERVAL_DURATION_SECONDS)
        except Empty:
            pass

        timenow = datetime.utcnow()

        # never check more often then X seconds
        if timenow - latest_check_timestamp < min_interval_duration:
            continue
        latest_check_timestamp = timenow
        logger.debug(f"Checking for idle containers now, at {timenow}")

        # every run rebuild the dictionary { user_name: list(user_containers) }
        # by default lists only running containers, see: https://docker-py.readthedocs.io/en/stable/containers.html#docker.models.containers.ContainerCollection.list
        all_containers = client.containers.list()
        user_containers = {}
        for c in all_containers:
            match = re_user_name.search(c.name)
            if match:
                # this is a user container
                username = match.group(1)
                if username in user_containers:
                    # add this container to this user
                    user_containers[username].append(c)
                else:
                    user_containers[username] = [c]

        if IGNORED_DEMO_USER in user_containers:
            # demo user should always be up, never spindown his containers
            del user_containers[IGNORED_DEMO_USER]

        logger.debug(user_containers)

        # go over each user and his containers
        # if no container has logs during last X minutes then stop the whole group
        for username, containers in user_containers.items():
            all_idle = True

            for container in containers:
                # Get the logs of the container
                try:
                    logs = container.logs(tail=1, timestamps=True)
                    logs_str = logs.decode()
                    # only interested in first element of latest log line
                    log = logs_str.split("\n").pop(0)
                    log_time, _ = log.split(" ", 1)
                except Exception as error:
                    # if container is still starting and has zero logs or whatever error
                    # do not bring the manager down
                    logger.warn(f"Problem evaluating log line: '{logs_str}'", exc_info=True)
                    all_idle = False
                    break

                # trim the trailing nano seconds by only taking first 19 chars
                timestamp = datetime.strptime(log_time[:19], '%Y-%m-%dT%H:%M:%S')
                last_log_time_diff = timenow - timestamp
                logger.debug(f"{container.name}: last log timestamp is {timestamp} which is {last_log_time_diff} seconds ago")
                if last_log_time_diff < seconds_before_idle:
                    logger.debug(f"Container {container.name} is still in use")
                    all_idle = False
                    break

            if all_idle:
                try:
                    dockercli = DockerClient(compose_project_name=username)
                    dockercli.compose.down(remove_orphans=True, timeout=FORCE_STOP_TIMEOUT, volumes=False, quiet=False)
                except DockerException as error:
                    # do not bring the manager down
                    logger.warn(error, exc_info=True)
