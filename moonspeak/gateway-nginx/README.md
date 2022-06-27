#Developing locally

### Step 1

Add DNS records, append moonspeak.test to /etc/hosts
```
127.0.0.1	moonspeak.test
```


### Step 2: docker option

Run nginx via docker. Execute the below command in the directory with README.

Bind mount nginx.conf into the container.
Use host network mode so nginx resolves
```
# docker run --network host --mount type=bind,src=$(pwd),dst=/etc/nginx/ -it nginx:alpine
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

Tweak nginx.conf to point listen directive to 127.0.0.1 host:
```
        listen       127.0.0.1:80 default_server;
```

Works with .TEST domains due to config in ./conf.d/test-upstreams.conf which hardcodes service IPs.

To listen for incoming urls, run netcat in different terminals.
Listening to what the nginx gateway sends to router.moonspeak.test:
```
# sudo netcat -l -p 80 --source 127.0.0.21
```

Listening to what the nginx gateway sends to deploy.moonspeak.test:
```
# sudo netcat -l -p 80 --source 127.0.0.22
```
