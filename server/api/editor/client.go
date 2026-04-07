package editor

import (
	"log/slog"
	"time"

	"github.com/gorilla/websocket"
)

const (
	sendBufferSize = 256
	writeWait      = 10 * time.Second    // Time allowed to write a message
	pongWait       = 60 * time.Second    // Time allowed to read the next pong
	pingPeriod     = (pongWait * 9) / 10 // Send pings at this interval (must be < pongWait)
	maxMessageSize = 512 * 1024          // 512KB max message size
)

// Client represents a single WebSocket connection in a room.
type Client struct {
	room       *Room
	conn       *websocket.Conn
	send       chan []byte

	// awarenessIDs tracks the Y.Doc clientIDs whose awareness state was sent
	// by this WebSocket client. Protected by room.mu.
	awarenessIDs map[int]struct{}
}

// readPump reads messages from the WebSocket and routes them to the room.
// Must be run as a goroutine — one per client.
func (c *Client) readPump() {
	defer func() {
		c.room.hub.unregister <- c
		c.conn.Close()
	}()
	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})
	for {
		// TODO: Add per-client rate limiting to prevent a single client from flooding
		// the room's incoming channel. Consider a token bucket or sliding window limiter.
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				slog.Error("websocket read error", "error", err)
			}
			return
		}
		if len(message) > 0 {
			slog.Debug("ws recv", "room", c.room.id, "type", message[0], "size", len(message))
		}
		c.room.incoming <- incomingMessage{data: message, sender: c}
	}
}

// writePump writes messages from the send channel to the WebSocket.
// Must be run as a goroutine — one per client.
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	for {
		select {
		case msg, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			slog.Debug("ws send", "room", c.room.id, "size", len(msg))
			if err := c.conn.WriteMessage(websocket.BinaryMessage, msg); err != nil {
				slog.Error("websocket write error", "error", err)
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
