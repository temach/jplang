FROM nginx:alpine

WORKDIR /etc/nginx

# the certificates are overriden in production
COPY fullchain.pem  ./
COPY privkey.pem    ./

COPY nginx.conf     ./
