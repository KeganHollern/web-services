package editor

import "log/slog"

// Hub manages all active rooms and routes client registration/unregistration.
type Hub struct {
	rooms      map[string]*Room
	register   chan *Client
	unregister chan *Client
}

// NewHub creates and starts a Hub. Call this once at startup.
func NewHub() *Hub {
	h := &Hub{
		rooms:      make(map[string]*Room),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
	go h.run()
	return h
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			room := client.room
			room.clients[client] = struct{}{}
			slog.Info("client joined room",
				slog.String("room", room.id),
				slog.Int("clients", len(room.clients)),
			)

		case client := <-h.unregister:
			room := client.room
			if _, ok := room.clients[client]; !ok {
				continue
			}
			delete(room.clients, client)
			close(client.send)
			slog.Info("client left room",
				slog.String("room", room.id),
				slog.Int("clients", len(room.clients)),
			)

			// Auto-cleanup: remove room when empty.
			if len(room.clients) == 0 {
				close(room.broadcast)
				delete(h.rooms, room.id)
				slog.Info("room closed", slog.String("room", room.id))
			}
		}
	}
}

// getOrCreateRoom returns the room for the given document ID, creating it if needed.
func (h *Hub) getOrCreateRoom(documentID string) *Room {
	if room, ok := h.rooms[documentID]; ok {
		return room
	}
	room := newRoom(documentID, h)
	h.rooms[documentID] = room
	go room.run()
	return room
}
