package editor

import (
	"context"
	"log/slog"
)

// joinRoomRequest is sent to the hub's event loop to atomically look up (or
// create) a room AND register the client in one step, closing the race window
// between getOrCreateRoom and register.
type joinRoomRequest struct {
	documentID string
	client     *Client // partially initialised (room field is set by the hub)
	result     chan *Room
}

// Hub manages all active rooms and routes client registration/unregistration.
type Hub struct {
	rooms      map[string]*Room
	joinRoom   chan joinRoomRequest
	unregister chan *Client
	store      EditorStore
}

// NewHub creates and starts a Hub. Call this once at startup.
func NewHub(store EditorStore) *Hub {
	h := &Hub{
		rooms:      make(map[string]*Room),
		joinRoom:   make(chan joinRoomRequest),
		unregister: make(chan *Client),
		store:      store,
	}
	go h.run()
	return h
}

func (h *Hub) run() {
	for {
		select {
		case req := <-h.joinRoom:
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
			// Set the client's room and register it atomically.
			req.client.room = room
			room.mu.Lock()
			room.clients[req.client] = struct{}{}
			room.mu.Unlock()
			slog.Info("client joined room",
				slog.String("room", room.id),
				slog.Int("clients", len(room.clients)),
			)
			req.result <- room

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

// JoinRoom atomically looks up (or creates) the room for the given document ID
// and registers the client. It is safe to call from any goroutine.
func (h *Hub) JoinRoom(documentID string, client *Client) *Room {
	req := joinRoomRequest{
		documentID: documentID,
		client:     client,
		result:     make(chan *Room, 1),
	}
	h.joinRoom <- req
	return <-req.result
}
