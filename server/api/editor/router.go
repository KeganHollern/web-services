package editor

import (
	"log/slog"
	"net/http"

	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v4"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // origin checking handled by nginx in production
	},
}

// Register mounts the editor WebSocket endpoint on the given API group.
func Register(api *echo.Group, hub *Hub) {
	api.GET("/editor/ws/:id", func(c echo.Context) error {
		documentID := c.Param("id")
		if documentID == "" {
			return echo.ErrBadRequest
		}

		ws, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
		if err != nil {
			slog.Error("websocket upgrade failed", "error", err)
			return nil // Upgrade already wrote the HTTP error response
		}

		slog.Debug("websocket upgrade succeeded",
			"room", documentID,
			"remote_addr", c.RealIP(),
		)

		room := hub.getOrCreateRoom(documentID)
		client := &Client{
			room: room,
			conn: ws,
			send: make(chan []byte, sendBufferSize),
		}
		hub.register <- client

		// Send sync step 1 (server's state vector) so the client can diff.
		room.sendSyncStep1(client)
		// Also send the full doc state as sync step 2 so the client has everything.
		room.sendSyncStep2(client)
		// Send current awareness state so the new client sees existing cursors.
		room.sendAwarenessState(client)

		go client.writePump()
		go client.readPump()

		return nil
	})
}
