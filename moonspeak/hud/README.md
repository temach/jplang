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


#### Option 1: docker lighttpd option

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


#### Option 2: system lighttpd option

Install lighttpd. 

Execute the below command in the directory with README:

- Set port with `MOONSPEAK_PORT=80` env variable.
- Set config file path with `-f`.
- Do NOT go to background with `-D`

```
MOONSPEAK_PORT=8003 lighttpd -f lighttpd.conf -D
```

### step 3: Send a request

Open http://moonspeak.test:8003/ in browser.

