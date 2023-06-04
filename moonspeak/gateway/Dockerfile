# nginx version is hard-linked to opentelemtry module version below!
FROM nginx:1.23.1

WORKDIR /etc/nginx

# the certificates are overriden in production
COPY fullchain.pem  ./
COPY privkey.pem    ./

COPY nginx.conf     ./

# from https://opentelemetry.io/blog/2022/instrument-nginx/
# and https://github.com/open-telemetry/opentelemetry-cpp-contrib/issues/284
ADD https://github.com/open-telemetry/opentelemetry-cpp-contrib/releases/download/webserver%2Fv1.0.3/opentelemetry-webserver-sdk-x64-linux.tgz /opt
RUN cd /opt ; tar xvfz opentelemetry-webserver-sdk-x64-linux.tgz
RUN cd /opt/opentelemetry-webserver-sdk; ./install.sh
ENV LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/opt/opentelemetry-webserver-sdk/sdk_lib/lib
# this directive can only appear at "main" context so just insert it dynamically, not via config
RUN echo "load_module /opt/opentelemetry-webserver-sdk/WebServerModule/Nginx/1.23.1/ngx_http_opentelemetry_module.so;\n$(cat /etc/nginx/nginx.conf)" > /etc/nginx/nginx.conf
COPY opentelemetry_module.docker.conf ./opentelemetry_module.conf
