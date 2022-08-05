To support different index files see: https://serverfault.com/questions/1090298/lighttpd-execute-cgi-bin-index-cgi-if-exists-in-the-folder
summary:

index-file.names = ( "cgi-bin/index.pl" )


# Developing locally

For configuration edit frontend/config/hud.json.
E.g. right now hud expects to connect to graph service on port 8010.

## The easy way using python

Install python 3 and in the directory with this README run:
```
python -m http.server 8003
```

Then navigate to `http://127.0.0.1:8003/frontend/`


## The advanced way

This is how its run on production in docker container using lighttpd.

#### Step 1

Add DNS records, append moonspeak.test to /etc/hosts
```
127.0.0.1	moonspeak.test
```

#### Step 2: docker nginx option

Run via docker. 

Execute the below command in the directory with README:

- Expose port 8003
- Bind mount this config folder into the container.

```
# docker run -p 8003:8003 \
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
# MOONSPEAK_UNIXSOCK="$PWD/here" MOONSPEAK_PORT=8003 lighttpd -f lighttpd.conf -D
```


### step 3: Send a request

Open http://moonspeak.test:8003/ in browser.










