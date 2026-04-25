package share

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"log/slog"
	"sync"
	"time"
)

// Envelope schema. The server inspects only `type`, `to`, and `from`; the
// `payload` field is treated as opaque ciphertext and is never decoded,
// re-serialised field-by-field, logged, or persisted.
//
// Client → server:
//
//	{ "type": "message", "to"?: "<peerId>", "payload": <opaque> }
//
// Server → client:
//
//	{ "type": "peer-joined", "peerId": "<peerId>" }
//	{ "type": "peer-left",   "peerId": "<peerId>" }
//	{ "type": "message",     "from": "<peerId>", "payload": <opaque> }
//	{ "type": "error",       "message": "<human-readable>" }
type clientEnvelope struct {
	Type    string          `json:"type"`
	To      string          `json:"to,omitempty"`
	Payload json.RawMessage `json:"payload,omitempty"`
}

type peerEventEnvelope struct {
	Type   string `json:"type"`
	PeerID string `json:"peerId"`
}

type messageEnvelope struct {
	Type    string          `json:"type"`
	From    string          `json:"from"`
	Payload json.RawMessage `json:"payload"`
}

type errorEnvelope struct {
	Type    string `json:"type"`
	Message string `json:"message"`
}

// Room holds relay state for up to two peers. The server only reads envelope
// routing fields; it never inspects, parses, or logs payloads.
type Room struct {
	id        string
	createdAt time.Time

	mu           sync.Mutex
	peers        map[*Peer]struct{}
	lastActivity time.Time
}

// newPeerID returns a fresh base64url-encoded 64-bit peer identifier.
func newPeerID() string {
	var b [8]byte
	if _, err := rand.Read(b[:]); err != nil {
		return ""
	}
	return base64.RawURLEncoding.EncodeToString(b[:])
}

// join adds a peer to the room, assigns it a unique peer ID, and notifies
// any existing peers via a `peer-joined` envelope. Returns false if the room
// is already at capacity.
func (r *Room) join(p *Peer) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	if len(r.peers) >= maxPeersPerRoom {
		return false
	}
	p.id = newPeerID()

	announcement, err := json.Marshal(peerEventEnvelope{Type: "peer-joined", PeerID: p.id})
	if err == nil {
		for peer := range r.peers {
			deliver(peer, announcement, r.id)
		}
	}

	r.peers[p] = struct{}{}
	r.lastActivity = time.Now()
	return true
}

// leave removes a peer from the room, notifies remaining peers with a
// `peer-left` envelope, and drops the room from the hub when empty.
func (r *Room) leave(hub *Hub, p *Peer) {
	r.mu.Lock()
	if _, ok := r.peers[p]; !ok {
		r.mu.Unlock()
		return
	}
	delete(r.peers, p)
	close(p.send)

	if p.id != "" {
		announcement, err := json.Marshal(peerEventEnvelope{Type: "peer-left", PeerID: p.id})
		if err == nil {
			for peer := range r.peers {
				deliver(peer, announcement, r.id)
			}
		}
	}

	empty := len(r.peers) == 0
	r.lastActivity = time.Now()
	r.mu.Unlock()

	if empty {
		hub.removeRoom(r.id)
		slog.Info("share room closed", "room", r.id)
	}
}

// relay wraps an incoming message in a server envelope and forwards it to the
// other peer(s). If `to` is non-empty it restricts delivery to that peer id.
// The payload is forwarded as a json.RawMessage so its bytes are copied
// through verbatim, never parsed or inspected.
func (r *Room) relay(sender *Peer, to string, payload json.RawMessage) {
	data, err := json.Marshal(messageEnvelope{
		Type:    "message",
		From:    sender.id,
		Payload: payload,
	})
	if err != nil {
		return
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.lastActivity = time.Now()
	for peer := range r.peers {
		if peer == sender {
			continue
		}
		if to != "" && peer.id != to {
			continue
		}
		deliver(peer, data, r.id)
	}
}

// deliver non-blockingly pushes data onto a peer's send channel. A full
// queue is logged and dropped — the peer will be torn down by its own
// read/write pumps if it's actually wedged.
func deliver(p *Peer, data []byte, roomID string) {
	select {
	case p.send <- data:
	default:
		slog.Warn("share peer send queue full", "room", roomID)
	}
}
