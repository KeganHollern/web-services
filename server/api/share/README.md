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
- `GET  /api/share/turn` — returns ICE servers for the optional relay
  fallback. 503 when TURN is not configured. Clients hit this only after the
  user explicitly opts in to relay after a direct-P2P ICE failure.

## Relay fallback (TURN)

Direct WebRTC is STUN-only by default. When ICE fails on a peer, the client
surfaces an opt-in modal; on confirm it fetches `/api/share/turn` and
renegotiates with a TURN server in the ICE list.

Env vars (all optional; endpoint returns 503 if `TURN_URLS` is unset):

- `TURN_URLS` — comma-separated TURN URLs, e.g.
  `turn:turn.example.com:3478?transport=udp,turn:turn.example.com:3478?transport=tcp`.
- `TURN_SECRET` — shared secret for the coturn REST API mode
  (draft-uberti-behave-turn-rest-00). When set, each `/turn` request mints
  credentials of the form `username="<unix-expiry>:lystic-share"`,
  `credential=base64(HMAC-SHA1(secret, username))`. The TURN server must run
  with the matching `--use-auth-secret --static-auth-secret=<secret>`.
- `TURN_USERNAME` + `TURN_PASSWORD` — static credentials, used when
  `TURN_SECRET` is not set. Simpler but any leak is valid until rotated;
  prefer the REST mode in production.
- `TURN_TTL_SECONDS` — lifetime of minted REST credentials, default 3600.
- `STUN_URLS` — STUN URLs to always include alongside TURN, default
  `stun:stun.l.google.com:19302`.

Security notes:

- Only the TURN server can see relayed traffic, and because DTLS-SRTP is
  negotiated end-to-end between the browsers, it sees only encrypted bytes.
- Credentials are served over the same HTTPS origin as the SPA; the endpoint
  does not require auth — knowing the origin is enough to ask for a TURN
  allocation. Rate-limit upstream (nginx) if abuse is a concern.
- Static-credential mode should be paired with a TURN server quota or ACL so
  one leaked password cannot burn unbounded bandwidth.

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
