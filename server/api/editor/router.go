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
	api.GET("/editor/:documentID", func(c echo.Context) error {
		documentID := c.Param("documentID")
		if documentID == "" {
			return echo.ErrBadRequest
		}

		ws, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
		if err != nil {
			slog.Error("websocket upgrade failed", "error", err)
			return nil // Upgrade already wrote the HTTP error response
		}

		room := hub.getOrCreateRoom(documentID)
		client := &Client{
			room: room,
			conn: ws,
			send: make(chan []byte, sendBufferSize),
		}
		hub.register <- client

		go client.writePump()
		go client.readPump()

		return nil
	})
}
