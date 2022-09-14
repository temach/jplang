#!/bin/sh
# see: https://docs.docker.com/config/containers/multi-service_container/

# Start the first process as daemon
python3 main.py --port 8080 &
  
# Start the second process as daemon
sudo nginx -c "$PWD/nginx.conf" -g 'daemon on;'
  
# wait by default waits for all processes to finish
# option "-n" on alpine indicates "wait for any process to finish"
wait -n
  
# Exit with status of process that exited first
exit $?
