# Server

Go backend using the [Echo](https://echo.labstack.com/) framework. Serves the frontend SPA from `dist/` and exposes API routes under `/api`.

## API Routes

- `/api/secret` — create and retrieve one-time secrets
- `/api/upload` — password-protected file uploads
- `/api/editor/ws/:id` — collaborative Yjs/Monaco editor over WebSocket
- `/api/share/room` — create a P2P relay room
- `/api/share/room/:id` (WebSocket) — peer relay for screen sharing (opaque ciphertext only)
- `/api/share/turn` — ICE server config for optional TURN relay fallback

## Configuration

Server is configured via environment variables:

| Variable | Required | Description |
| --- | --- | --- |
| `upload_password` | Yes | Password for the upload service |
| `MONGO_URI` | No | MongoDB connection string (e.g. `mongodb://localhost:27017`) |
| `MONGO_DB` | No | MongoDB database name |
| `TURN_URLS` | No | Comma-separated TURN URLs for WebRTC relay fallback |
| `TURN_SECRET` | No | Shared secret for coturn REST API mode (preferred) |
| `TURN_USERNAME` | No | Static TURN username (used when `TURN_SECRET` is not set) |
| `TURN_PASSWORD` | No | Static TURN password (used when `TURN_SECRET` is not set) |
| `TURN_TTL_SECONDS` | No | Lifetime of minted TURN credentials, default 3600 |
| `STUN_URLS` | No | STUN URLs to include alongside TURN, default `stun:stun.l.google.com:19302` |

If `MONGO_URI` and `MONGO_DB` are not set, the secret store falls back to in-memory storage (secrets won't persist across restarts).
