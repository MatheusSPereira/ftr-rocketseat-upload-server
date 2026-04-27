FROM node:20.18 AS base

FROM base AS deps

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

FROM base AS build

WORKDIR /usr/src/app

COPY . .
COPY --from=deps /usr/src/app/node_modules ./node_modules

RUN npm run build
RUN npm prune --production

# Distroless
FROM gcr.io/distroless/nodejs20-debian13 AS deploy

USER 1000

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/package.json ./package.json

EXPOSE 3334

CMD ["dist/infra/http/server.js"]
