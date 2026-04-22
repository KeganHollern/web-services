package share

import (
	"crypto/rand"
	"encoding/base64"
	"log/slog"
	"sync"
	"time"
)

const (
	maxPeersPerRoom = 2
	roomTTL         = 60 * time.Second
	janitorInterval = 10 * time.Second
)

// Hub tracks active relay rooms in-memory. Safe for concurrent use.
type Hub struct {
	mu    sync.RWMutex
	rooms map[string]*Room
}

// NewHub creates a Hub and starts its janitor goroutine.
func NewHub() *Hub {
	h := &Hub{rooms: make(map[string]*Room)}
	go h.janitor()
	return h
}

// CreateRoom generates a new room with a random 128-bit base64url ID.
func (h *Hub) CreateRoom() (*Room, error) {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		return nil, err
	}
	id := base64.RawURLEncoding.EncodeToString(b[:])

	now := time.Now()
	r := &Room{
		id:           id,
		createdAt:    now,
		peers:        make(map[*Peer]struct{}),
		lastActivity: now,
	}

	h.mu.Lock()
	h.rooms[id] = r
	h.mu.Unlock()
	return r, nil
}

// GetRoom returns the room with the given id, or nil if absent.
func (h *Hub) GetRoom(id string) *Room {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return h.rooms[id]
}

func (h *Hub) removeRoom(id string) {
	h.mu.Lock()
	delete(h.rooms, id)
	h.mu.Unlock()
}

// janitor sweeps rooms that have been idle past roomTTL.
func (h *Hub) janitor() {
	ticker := time.NewTicker(janitorInterval)
	defer ticker.Stop()
	for range ticker.C {
		h.sweep(time.Now())
	}
}

func (h *Hub) sweep(now time.Time) {
	h.mu.Lock()
	defer h.mu.Unlock()
	for id, r := range h.rooms {
		r.mu.Lock()
		expired := len(r.peers) == 0 && now.Sub(r.lastActivity) > roomTTL
		r.mu.Unlock()
		if expired {
			delete(h.rooms, id)
			slog.Info("share room expired", "room", id)
		}
	}
}
