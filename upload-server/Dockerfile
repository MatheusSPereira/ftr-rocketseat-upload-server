FROM node:20-alpine3.21

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build
RUN npm prune --production

ENV PORT=3334
ENV NODE_ENV=development

# Database
ENV DATABASE_URL="postgresql://docker:docker@localhost:5432/upload"

# Cloudflare
ENV CLOUDFLARE_ACCOUNT_ID="#"
ENV CLOUDFLARE_ACCESS_KEY_ID="#"
ENV CLOUDFLARE_SECRET_ACCESS_KEY="#"
ENV CLOUDFLARE_BUCKET="#"
ENV CLOUDFLARE_PUBLIC_URL="https://localhost"

EXPOSE 3334

CMD ["npm", "run", "start"]