# share — encrypted P2P signaling relay

This package provides a WebSocket relay for two-peer rooms (e.g. screen-share
sessions). Peers exchange already-encrypted frames through the server; the
server only forwards bytes and never inspects, parses, or stores payloads.

## Endpoints

- `POST /api/share/room` — creates a new room. Responds with
  `{ "roomId": "<base64url 128-bit>" }`.
- `GET  /api/share/room/:id` (WebSocket) — peers upgrade and join. Max 2 peers
  per room; a third connection is accepted, sent a `ClosePolicyViolation`
  close frame with reason `"room full"`, and dropped.

## Relay semantics

- Every frame received from one peer is forwarded verbatim (same WS opcode,
  same bytes) to the other peer.
- Payloads are treated as opaque ciphertext — never decoded, JSON-parsed,
  logged, or persisted.
- WebSocket ping/pong keep-alive is handled transparently.

## Lifetime

- Room state is in-memory only. Nothing touches disk or the database.
- Stored per room: `{ roomId, createdAt, peerCount }` plus the live peer
  connections.
- Rooms are removed immediately when all peers disconnect.
- A janitor sweeps rooms every 10s and removes any room with zero peers whose
  `lastActivity` is older than 60s (covers rooms no peer ever joined).

## Security model

- The server sees ciphertext only. It holds no key material and cannot
  decrypt traffic.
- Confidentiality and authenticity come from a URL-fragment key shared out of
  band between the two peers. Fragments never leave the browser, so the
  server cannot learn the key even in principle.
- No auth middleware is required. Knowledge of the room ID alone grants relay
  access, but an attacker who joins without the fragment key can only observe
  opaque ciphertext.
- Logs contain room IDs, connect/disconnect events, and byte counts. They
  never contain payload bytes or any decoded metadata.
- The server is intentionally dumb: it is a relay, not a signaling protocol.
