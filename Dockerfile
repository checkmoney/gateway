FROM keymetrics/pm2:10-alpine

RUN apk add --no-cache http-parser

RUN echo -e 'http://dl-cdn.alpinelinux.org/alpine/edge/main\nhttp://dl-cdn.alpinelinux.org/alpine/edge/community\nhttp://dl-cdn.alpinelinux.org/alpine/edge/testing' > /etc/apk/repositories
RUN apk add --no-cache yarn git postgresql-client

WORKDIR /app

COPY . .

RUN yarn

RUN yarn build

EXPOSE 3000

ENV NODE_ENV="production"

CMD [ "pm2-docker", "start", "pm2.config.js" ]