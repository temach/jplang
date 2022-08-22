FROM node as builder

WORKDIR /opt/ms/frontend

RUN npm install --global gulp-cli
COPY frontend/package.json           package.json
COPY frontend/package-lock.json      package-lock.json
RUN npm install

COPY frontend/src           src
COPY frontend/gulpfile.js   gulpfile.js
RUN gulp
 

FROM nginx:alpine
COPY --from=builder /opt/ms/frontend/dist /etc/nginx/frontend/dist
COPY nginx.conf /etc/nginx/nginx.conf
