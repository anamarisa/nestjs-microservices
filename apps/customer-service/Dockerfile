FROM node:18-alpine AS development

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm install -g @nestjs/cli

CMD ["npm", "run", "start:dev", "customer-service"]