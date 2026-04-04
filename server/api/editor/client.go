package editor

import (
	"log/slog"

	"github.com/gorilla/websocket"
)

const sendBufferSize = 256

// Client represents a single WebSocket connection in a room.
type Client struct {
	room *Room
	conn *websocket.Conn
	send chan []byte
}

// readPump reads messages from the WebSocket and broadcasts them to the room.
// Must be run as a goroutine — one per client.
func (c *Client) readPump() {
	defer func() {
		c.room.hub.unregister <- c
		c.conn.Close()
	}()
	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				slog.Error("websocket read error", "error", err)
			}
			return
		}
		c.room.broadcast <- broadcastMessage{data: message, sender: c}
	}
}

// writePump writes messages from the send channel to the WebSocket.
// Must be run as a goroutine — one per client.
func (c *Client) writePump() {
	defer c.conn.Close()
	for msg := range c.send {
		if err := c.conn.WriteMessage(websocket.BinaryMessage, msg); err != nil {
			slog.Error("websocket write error", "error", err)
			return
		}
	}
}
