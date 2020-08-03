FROM node:10-alpine

WORKDIR /app

COPY . .

RUN yarn

RUN yarn build

EXPOSE 3000

ENV NODE_ENV="production"

CMD [ "node", "--require", "./tsconfig-paths-bootstrap.js", "dist/src/main.js" ]