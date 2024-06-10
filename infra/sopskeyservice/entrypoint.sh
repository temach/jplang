#!/bin/bash

# run sops keyservice for kms user, anyone who can login will be able to access
# To pass the master key to sops use SOPS_AGE_KEY or SOPS_AGE_KEY_FILE env vars
# see: https://github.com/getsops/sops?tab=readme-ov-file#22encrypting-using-age
su - kms -s /bin/bash -c "SOPS_AGE_KEY_FILE=~/.ssh/age_keys.txt sops keyservice --network unix --address ~/.ssh/sops.sock --verbose" &

# ssh will auto fork into background
/usr/sbin/sshd -e -D -p 2222 &

# kill child jobs if CTRL-C is received in main, see: https://linuxconfig.org/how-to-propagate-a-signal-to-child-processes-from-a-bash-script
trap "kill $(jobs -p);" TERM INT

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?
