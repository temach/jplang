#Developing locally

### The easy way using python

Install python 3 and in the directory with this README run:
```
python -m http.server 8010
```

Then navigate to `http://127.0.0.1:8010/`


### The advanced way

This is how its run in docker container, using nginx.

#### Step 1

Add DNS records, append moonspeak.test to /etc/hosts
```
127.0.0.1	moonspeak.test
```

#### Step 2: docker nginx option

Run nginx via docker. 

Execute the below command in the directory with README:

- Expose port 8010
- Bind mount this config folder into the container.

```
# docker run -p 8010:8010 \
    --mount type=bind,src=$(pwd)/frontend,dst=/etc/nginx/frontend \
    --mount type=bind,src=$(pwd)/nginx.conf,dst=/etc/nginx/nginx.conf \
    -it nginx:alpine
```


#### Step 2: system nginx option

Install nginx. 

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

Or visit http://moonspeak.test:8010/ in browser.
