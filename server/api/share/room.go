package share

import (
	"log/slog"
	"sync"
	"time"
)

// Room holds relay state for up to two peers. The server never inspects,
// parses, or logs payloads — it only forwards frames verbatim.
type Room struct {
	id        string
	createdAt time.Time

	mu           sync.Mutex
	peers        map[*Peer]struct{}
	lastActivity time.Time
}

// join adds a peer to the room. Returns false if the room is full.
func (r *Room) join(p *Peer) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	if len(r.peers) >= maxPeersPerRoom {
		return false
	}
	r.peers[p] = struct{}{}
	r.lastActivity = time.Now()
	return true
}

// leave removes a peer from the room. If the room becomes empty, it is
// removed from the hub immediately so a fresh peer cannot join a
// half-abandoned session.
func (r *Room) leave(hub *Hub, p *Peer) {
	r.mu.Lock()
	if _, ok := r.peers[p]; !ok {
		r.mu.Unlock()
		return
	}
	delete(r.peers, p)
	close(p.send)
	empty := len(r.peers) == 0
	r.lastActivity = time.Now()
	r.mu.Unlock()

	if empty {
		hub.removeRoom(r.id)
		slog.Info("share room closed", "room", r.id)
	}
}

// relay forwards a frame to the other peer. Payload is treated as opaque:
// no parsing, no logging of bytes.
func (r *Room) relay(sender *Peer, typ int, data []byte) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.lastActivity = time.Now()
	for peer := range r.peers {
		if peer == sender {
			continue
		}
		select {
		case peer.send <- frame{typ: typ, data: data}:
		default:
			slog.Warn("share peer send queue full", "room", r.id)
		}
	}
}
