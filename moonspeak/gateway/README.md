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

### Generating test wildcard certificates

https://www.brainbytez.nl/tutorials/linux-tutorials/create-a-self-signed-wildcard-ssl-certificate-openssl/

```
# mkdir self-signed && cd self-signed
# openssl genrsa -des3 -out CAPrivate.key 2048
# openssl req -x509 -new -nodes -key CAPrivate.key -sha256 -days 3650 -out CAPrivate.pem
# openssl genrsa -out MyPrivate.key 2048
# openssl req -new -key MyPrivate.key -out MyRequest.csr
# vim openssl.ss.cnf
# cat openssl.ss.cnf
basicConstraints=CA:FALSE
subjectAltName=DNS:*.selfhosted.moonspeak.org
extendedKeyUsage=serverAuth
# openssl x509 -req -in MyRequest.csr -CA CAPrivate.pem -CAkey CAPrivate.key -CAcreateserial -extfile openssl.ss.cnf -out MyCert.crt -days 3650 -sha256
 ```
