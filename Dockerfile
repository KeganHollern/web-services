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
FROM golang:1.24.5 as gobuilder
WORKDIR /app
COPY server/go.mod server/go.sum ./
RUN go mod download
COPY server/. ./
RUN go build -o main main.go

# TODO: host from go server instead of nginx
FROM nginx:1.26-alpine as runner
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html

# TODO: this stuff is for future server
WORKDIR /app
COPY --from=gobuilder /app/main /app/main