FROM node as builder

WORKDIR /opt/moonspeak/frontend

RUN npm install --global gulp-cli
COPY frontend/package.json           package.json
COPY frontend/package-lock.json      package-lock.json
RUN npm install

COPY frontend/src           src
COPY frontend/gulpfile.js   gulpfile.js
RUN gulp
 

FROM nginx:alpine
WORKDIR /etc/nginx
COPY --from=builder /opt/moonspeak/frontend/dist ./frontend/dist
COPY nginx.conf  ./
