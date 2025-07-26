# download deps
FROM node:24-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY web/package.json web/package-lock.json ./
RUN npm ci

# build source code
FROM node:24-alpine as builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY web/. ./
RUN npm run build

# TODO: build go server

# TODO: host from go server instead of nginx
FROM nginx:1.26-alpine as runner
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html