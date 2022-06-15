#Developing locally

### Step 1

Add DNS records, append moonspeak.test to /etc/hosts
```
127.0.0.1	moonspeak.test
```


### Step 2: docker option

Run nginx via docker. Execute the below command in the directory with README.

Bind mount the HTML files and nginx.conf into the container.
Expose port 80.
```
# docker run -p 80:80 --mount type=bind,src=$(pwd)/frontend,dst=/etc/nginx/frontend --mount type=bind,src=$(pwd)/nginx.conf,dst=/etc/nginx/nginx.conf -it nginx:alpine
```


### Step 2: system install option

Install nginx and just run the binary. Execute the below command in the directory with README.

Set the prefix with `-p` to serve HTML.
Set config file path with `-c`.
Do not start daemon.
Use the current user to avoid permission denied error, becasue nginx always does setuid/setguid when run as root.

```
# sudo nginx -p $(pwd) -c $(pwd)/nginx.conf -g "daemon off; user $(whoami);"
```
