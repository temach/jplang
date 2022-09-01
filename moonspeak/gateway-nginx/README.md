#Developing locally

### Docker option

Run nginx via docker. Execute the below command in the directory with README.

Expose port 80.
Bind mount this config folder into the container.
Bind mount unixsocks dir to share unix sockets.
```
# docker run -p 80:80 \
    --mount type=bind,src=$(pwd),dst=/etc/nginx/ \
    --mount type=bind,src=$(pwd)/../unixsocks/,dst=/etc/unixsocks/ \
    -it nginx:alpine
```


### System install option

Install nginx. 

Execute the below command in the directory with README:
- Set config file path with `-c`.
- Do not start daemon.
- Write to stderr with level of "debug".
```
# sudo nginx -c $(pwd)/nginx.conf -g "daemon off; error_log stderr debug;"
```


### View/debug proxied socket connections

Install socat utility and listen on the sockets (to pretend that you are router service, to see whatever it receives):

```
# sudo socat UNIX-LISTEN:../unixsocks/router.sock,mode=766,fork stdout
```

For more socat options, see: http://www.dest-unreach.org/socat/doc/socat.html#ADDRESS_OPTIONS
