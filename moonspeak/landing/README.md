#Developing locally

## Option 1: Open index.html in any browser

You just open the file ./frontend/src/index.html in any browser without using a backing web server.
You will see placeholder names and placeholder text for images (if the image has localised text).

Works fine when you just have a small change to make.


## Option 2: Run a local web server

### The easy way using python

Install python 3 and in the directory with this README run:
```
python -m http.server 8002
```

Then navigate to `http://127.0.0.1:8002/frontend/test`


### The production way

This is how its run in production, using nginx and unix sockets.

#### Option 1: Docker

Run nginx via docker. 

Execute the below command in the directory with README:

- Map localhost port 80 to container port 8002
- Bind mount the config and sources folder into the container.
- Bind mount unixsocks dir to share unix sockets.

```
# docker run -p 80:8002 \
    --mount type=bind,src=$(pwd),dst=/etc/nginx/ \
    --mount type=bind,src=$(pwd)/../unixsocks/,dst=/etc/unixsocks/ \
    -it nginx:alpine
```


#### Option 2: System install nginx

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


### Send a request

Via unix sockets:
```
# curl --unix-socket ../unixsocks/landing.sock http://moonspeak.localhost/
```

Or open http://moonspeak.localhost:8002/ in browser.



### Development

To use font awesome:
1. Copy a specific declaration from FontAwesomeAll.css into FontAwesome.css
2. Change the css unicode escape sequence to the actual byte value
3. Rely on gulp fontmin task to minify font-awesome files
