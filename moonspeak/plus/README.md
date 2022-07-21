# Developing locally

### The easy way using python

Install python 3 and in the directory with this README run:
```
python -m http.server 8010
```

Then navigate to `http://127.0.0.1:8010/frontend/`


### The advanced way

This is how its run on production in docker container using lighttpd.

#### Step 1

Add DNS records, append moonspeak.test to /etc/hosts
```
127.0.0.1	moonspeak.test
```

#### Step 2: docker nginx option

Run via docker. 

Execute the below command in the directory with README:

- Expose port 8010
- Bind mount this config folder into the container.

```
# docker run -p 8010:8010 \
    --mount type=bind,src=$(pwd)/frontend,dst=/etc/nginx/frontend \
    --mount type=bind,src=$(pwd)/nginx.conf,dst=/etc/nginx/nginx.conf \
    -it sebp/lighttpd:latest
```


#### Step 2: system nginx option

Install lighttpd. 

Execute the below command in the directory with README:

- Set port with `PORT=80` env variable.
- Set config file path with `-f`.
- Do NOT go to background with `-D`

```
# PORT=8010 lighttpd -f lighttpd.conf -D
```


### step 3: Send a request

Open http://moonspeak.test:8010/ in browser.
