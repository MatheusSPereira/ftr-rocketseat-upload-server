FROM node:20.18

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3334

CMD ["npm", "run", "dev"]