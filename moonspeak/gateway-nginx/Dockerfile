FROM nginx:alpine

# the certificates are overriden in production
COPY fullchain.pem /etc/nginx/fullchain.pem
COPY privkey.pem /etc/nginx/privkey.pem

COPY nginx.conf /etc/nginx/nginx.conf
