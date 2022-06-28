#Developing locally

### Step 1

Add DNS records, append moonspeak.test to /etc/hosts
```
127.0.0.1	moonspeak.test
```


### Step 2: docker option

Run nginx via docker. Execute the below command in the directory with README.

Expose port 80.
Bind mount this config folder into the container.
Bind mount /opt/moonspeak/ to reach unix sockets.
```
# docker run -p 80:80 \
    --mount type=bind,src=$(pwd)/frontend,dst=/etc/nginx/frontend \
    --mount type=bind,src=$(pwd)/nginx.conf,dst=/etc/nginx/nginx.conf \
    --mount type=bind,src=/opt/moonspeak/,dst=/opt/moonspeak/ \
    -it nginx:alpine
```


### Step 2: system install option

Install nginx. 

Create directory for unix sockets:
```
# sudo mkdir -p /opt/moonspeak/unixsock/
```

Execute the below command in the directory with README:
- Set the prefix with `-p` to serve HTML.
- Set config file path with `-c`.
- Do not start daemon.
- Use the current user to avoid permission denied error, becasue nginx always does setuid/setguid when run as root.
- Write to stderr with level of "debug".
```
# sudo nginx -p $(pwd) -c $(pwd)/nginx.conf -g "daemon off; user $(whoami); error_log stderr debug;"
```

### step 3: Send a request

Via unix sockets:
```
# curl --unix-socket /opt/moonspeak/landing.sock http://moonspeak.test/
# curl --unix-socket /opt/moonspeak/landing.sock http://moonspeak.test/test/
```

Or visit http://moonspeak.test/test/ in browser.
