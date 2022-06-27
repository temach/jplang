FROM nginx:alpine

# for production build add:
# --build-arg PROD_CONFIG="$(cat ./conf.d/prod*)"
ARG PROD_CONFIG
RUN echo $PROD_CONFIG > /etc/nginx/prod.conf

COPY nginx.conf /etc/nginx/nginx.conf
