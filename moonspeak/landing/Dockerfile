FROM node:19.2 as builder

WORKDIR /opt/moonspeak/frontend

RUN npm install --global gulp-cli@2.3.0
COPY frontend/package.json           package.json
COPY frontend/package-lock.json      package-lock.json
RUN npm install

COPY frontend/src           src
COPY frontend/gulpfile.js   gulpfile.js
RUN gulp
 

FROM nginx:1.23-alpine
WORKDIR /etc/nginx
COPY --from=builder /opt/moonspeak/frontend/dist ./frontend/dist
COPY nginx.conf  ./
