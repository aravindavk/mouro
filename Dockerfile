FROM node:8

# Create app directory
RUN mkdir -p /usr/src/app
# Bundle app source
WORKDIR /usr/src/app
COPY . /usr/src/app

RUN rm -rf /usr/src/app/node_modules && \
    npm install

CMD [ "npm", "start" ]