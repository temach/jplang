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
# docker run -p 80:80 --mount type=bind,src=$(pwd),dst=/etc/nginx/ --mount type=bind,src=/opt/moonspeak/,dst=/opt/moonspeak/ -it nginx:alpine
```


### Step 2: system install option

Install nginx and just run the binary. Execute the below command in the directory with README.

Set config file path with `-c`.
Do not start daemon.
Write to stderr with level of "debug".

```
# sudo nginx -c $(pwd)/nginx.conf -g "daemon off; error_log stderr debug;"
```

### Optional Step 3: view/debug proxied connections

Install socat utility and listen on the sockets (for router and deploy services):

```
# sudo socat UNIX-LISTEN:/opt/moonspeak/router.sock,mode=766,fork stdout
# sudo socat UNIX-LISTEN:/opt/moonspeak/deploy.sock,mode=766,fork stdout
```

For more socat options, see: http://www.dest-unreach.org/socat/doc/socat.html#ADDRESS_OPTIONS
