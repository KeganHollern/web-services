package editor

import (
	"context"
	"log/slog"
)

// getRoomRequest is sent to the hub's event loop to safely look up or create a room.
type getRoomRequest struct {
	documentID string
	result     chan *Room
}

// Hub manages all active rooms and routes client registration/unregistration.
type Hub struct {
	rooms      map[string]*Room
	register   chan *Client
	unregister chan *Client
	getRoom    chan getRoomRequest
	store      EditorStore
}

// NewHub creates and starts a Hub. Call this once at startup.
func NewHub(store EditorStore) *Hub {
	h := &Hub{
		rooms:      make(map[string]*Room),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		getRoom:    make(chan getRoomRequest),
		store:      store,
	}
	go h.run()
	return h
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			room := client.room
			room.mu.Lock()
			room.clients[client] = struct{}{}
			room.mu.Unlock()
			slog.Info("client joined room",
				slog.String("room", room.id),
				slog.Int("clients", len(room.clients)),
			)

		case client := <-h.unregister:
			room := client.room
			room.mu.Lock()
			if _, ok := room.clients[client]; !ok {
				room.mu.Unlock()
				continue
			}
			delete(room.clients, client)
			close(client.send)
			empty := len(room.clients) == 0
			room.mu.Unlock()

			slog.Info("client left room",
				slog.String("room", room.id),
				slog.Int("clients", len(room.clients)),
			)

			// Auto-cleanup: persist and remove room when empty.
			if empty {
				room.persistState()
				close(room.incoming)
				delete(h.rooms, room.id)
				slog.Info("room closed", slog.String("room", room.id))
			}

		case req := <-h.getRoom:
			room, ok := h.rooms[req.documentID]
			if !ok {
				slog.Debug("creating new room", "room", req.documentID)
				room = newRoom(req.documentID, h, h.store)
				room.loadState(context.TODO())
				h.rooms[req.documentID] = room
				go room.run()
			} else {
				slog.Debug("reusing existing room", "room", req.documentID)
			}
			req.result <- room
		}
	}
}

// Shutdown persists all active rooms. Call during graceful shutdown.
// After Shutdown returns, no new requests should be processed.
func (h *Hub) Shutdown() {
	for _, room := range h.rooms {
		room.persistState()
		slog.Info("persisted room on shutdown", "room", room.id)
	}
}

// getOrCreateRoom returns the room for the given document ID, creating it if needed.
// It is safe to call from any goroutine — the lookup is routed through the hub's event loop.
func (h *Hub) getOrCreateRoom(documentID string) *Room {
	req := getRoomRequest{
		documentID: documentID,
		result:     make(chan *Room, 1),
	}
	h.getRoom <- req
	return <-req.result
}
