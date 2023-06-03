# configure parent cgroup for all containers to limit mem and cpu so SSH to VM will always work
# Here we use the systemd cgroup driver, we could have used the /sys/fs/ cgroups driver
#
# accurate article: https://baykara.medium.com/docker-resource-management-via-cgroups-and-systemd-633b093a835c
# semi-accurate answer: https://stackoverflow.com/questions/63169814/limit-docker-or-docker-compose-resources-globally
# cgroup-parent in docs: https://docs.docker.com/engine/reference/commandline/dockerd/#daemon-user-namespace-options
# a slightly different story: https://unix.stackexchange.com/questions/537645/how-to-limit-docker-total-resources

# check result with "systemd-cgls" and "systemd-cgtop", your containers should be under your slice.


cat << EOF > /etc/systemd/system/moonspeak-docker-crgoup.slice
# see article: https://baykara.medium.com/docker-resource-management-via-cgroups-and-systemd-633b093a835c
# official doc: https://www.freedesktop.org/software/systemd/man/systemd.resource-control.html

[Unit]
Description=moonspeak-docker-cgroup
Before=slices.target

[Slice]
MemoryAccounting=true
MemoryHigh=2G
MemoryMax=2.3G
MemoryMaxSwap=0.3G
CPUAccounting=true
CPUQuota=80%
EOF


# this must be done by HAND
cat << EOF >> /etc/systemd/system/multi-user.target.wants/docker.service
[Service]
Slice=moonspeak-docker-cgroup.slice
ExecStart=/usr/bin/dockerd --exec-opt native.cgroupdriver=systemd
EOF


cat << EOF > /etc/docker/daemon.json
{
  "cgroup-parent": "moonspeak-docker-cgroup.slice"
}
EOF
