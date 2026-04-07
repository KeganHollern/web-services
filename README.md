# Lystic's Web Platform

Hi! I got bored at work and decided I wanted to expand my personal web services and make them open source.

The goal is to create zero-trust systems where any data which hits my servers is completely encrypted on the client side.

Feel free to open a PR and make changes, but if you do anything complex I won't understand it and won't merge it!

## Architecture

- **Frontend** — React + TypeScript SPA built with Vite (`web/`)
- **Backend** — Go server using Echo, serves the SPA and API routes (`server/`)
- **Docker** — Multi-stage Dockerfile builds both frontend and backend into a single Alpine image

## Services

| Service | Status | Description |
|---------|--------|-------------|
| home | Done | Homepage |
| blog | Done | Personal blog (MDX) |
| secret | Done | Zero-trust secret sharing (client-side encryption) |
| edit | Done | Collaborative markdown editor |
| swap | Done | Fee-less Uniswap frontend alternative + Aave lending |
| upload | WIP | Password-protected file uploader |

## Dependencies

MongoDB is used for persistent secret storage but is **optional**. If the `MONGO_URI` and `MONGO_DB` environment variables are not set, the server falls back to in-memory storage (secrets won't survive restarts).

## Configuration

See [server/README.md](server/README.md) for server configuration.
See [web/README.md](web/README.md) for frontend configuration.

## TODO

- p2p screen sharing (using Chrome API & WebRTC to avoid sending data to the server)
- file converter (ideally in-browser using WebAssembly)
- enable mongodb secret sharing and horizontal scaling
- enable mongodb for editor
- support horizontal scaling for pods w/ collaborative editor
- reimagine the "upload" functionality

Feel free to add a PR suggesting new services!
