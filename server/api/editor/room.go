package editor

// broadcastMessage pairs data with the sender so the room can skip echoing back.
type broadcastMessage struct {
	data   []byte
	sender *Client
}

// Room groups clients editing the same document.
type Room struct {
	id        string
	hub       *Hub
	clients   map[*Client]struct{}
	broadcast chan broadcastMessage
}

func newRoom(id string, hub *Hub) *Room {
	return &Room{
		id:        id,
		hub:       hub,
		clients:   make(map[*Client]struct{}),
		broadcast: make(chan broadcastMessage, 256),
	}
}

// run processes broadcasts for this room. Exits when the broadcast channel is closed.
func (r *Room) run() {
	for msg := range r.broadcast {
		for client := range r.clients {
			if client == msg.sender {
				continue
			}
			select {
			case client.send <- msg.data:
			default:
				// Client too slow — disconnect it.
				r.hub.unregister <- client
			}
		}
	}
}
