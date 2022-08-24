#Developing locally

## Option 1: Open index.html in any browser

You just open the file ./frontend/templates/index.html in any browser without using a backing web server.
You will see placeholder names and placeholder text for images (if the image has localised text).

Works well when you want to change only the templates.


## Option 2: Run a local web server

### The easy way using python

Install python 3 and in the directory with this README run:
```
python -m http.server 8080
```

Then navigate to `http://127.0.0.1:8080/frontend/test`

This is enough to test .toml translations and see how different languages actually display.


### The production way

This is how its run in production, using nginx and unix sockets.

#### Step 1

Add DNS records, append moonspeak.test to /etc/hosts
```
127.0.0.1	moonspeak.test
```

Create directory for unix sockets (its fixed in nginx.conf) and give yourself permissions to write there:
```
# sudo mkdir -p /opt/moonspeak/unixsock/
# sudo chown -R $USER:$USER /opt/moonspeak/
```


#### Step 2: docker option

Run nginx via docker. 

Execute the below command in the directory with README:

- Expose port 80.
- Bind mount this config folder into the container.
- Bind mount /opt/moonspeak/ to reach unix sockets.

```
# docker run -p 80:80 \
    --mount type=bind,src=$(pwd)/frontend,dst=/etc/nginx/frontend \
    --mount type=bind,src=$(pwd)/nginx.conf,dst=/etc/nginx/nginx.conf \
    --mount type=bind,src=/opt/moonspeak/,dst=/opt/moonspeak/ \
    -it nginx:alpine
```


#### Step 2: system install option

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

Via unix sockets:
```
# curl --unix-socket /opt/moonspeak/landing.sock http://moonspeak.test/
# curl --unix-socket /opt/moonspeak/landing.sock http://moonspeak.test/test/
```

Or visit http://moonspeak.test/test/ in browser.



### Development

To use font awesome:
1. Copy a specific declaration from FontAwesomeAll.css into FontAwesome.css
2. Change the css unicode escape sequence to the actual byte value
3. Rely on gulp fontmin task to minify font-awesome files
