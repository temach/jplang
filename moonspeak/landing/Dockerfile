FROM node as builder

WORKDIR /opt/ms

RUN npm install --global gulp-cli
COPY package.json           ./
COPY package-lock.json      ./
RUN npm install

COPY frontend       frontend/
COPY gulpfile.js    ./
RUN gulp
 

FROM nginx:alpine
COPY --from=builder /opt/ms/dist /etc/nginx/frontend
COPY nginx.conf /etc/nginx/nginx.conf
