FROM node:14-alpine
ENV NODE_ENV=DEV

COPY . /app

EXPOSE 80

WORKDIR /app

CMD [ "node", "./server.js" ]