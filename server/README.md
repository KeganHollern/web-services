# Server

Go backend using the [Echo](https://echo.labstack.com/) framework. Serves the frontend SPA from `dist/` and exposes API routes under `/api`.

## API Routes

- `/api/secret` — create and retrieve one-time secrets
- `/api/upload` — password-protected file uploads

## Configuration

Server is configured via environment variables:

| Variable | Required | Description |
| --- | --- | --- |
| `upload_password` | Yes | Password for the upload service |
| `MONGO_URI` | No | MongoDB connection string (e.g. `mongodb://localhost:27017`) |
| `MONGO_DB` | No | MongoDB database name |

If `MONGO_URI` and `MONGO_DB` are not set, the secret store falls back to in-memory storage (secrets won't persist across restarts).
