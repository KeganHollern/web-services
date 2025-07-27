# download deps
FROM node:24-alpine AS deps
WORKDIR /app
COPY web/package.json web/package-lock.json ./
RUN npm ci

# build source code
FROM node:24-alpine as builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY web/. ./
RUN npm run build

# build go server
FROM golang:1.24.5 as gobuilder
WORKDIR /app
COPY server/go.mod server/go.sum ./
RUN go mod download
COPY server/. ./
RUN CGO_ENABLED=0 go build -o main main.go

# setup runtime
FROM alpine:latest as runtime
WORKDIR /app
COPY --from=builder /app/dist /app/dist
COPY --from=gobuilder /app/main /app/main
CMD [ "/app/main" ]
