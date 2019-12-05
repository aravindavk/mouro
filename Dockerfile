FROM node:8
LABEL MAINTAINER Andres Junge <andres.junge@consensys.net>

USER root

# Create app directory
RUN mkdir -p /usr/src/app
# Bundle app source
WORKDIR /usr/src/app
COPY . /usr/src/app

RUN rm -rf /usr/src/app/node_modules && \
    npm install

EXPOSE 3000

CMD [ "npm", "start" ]