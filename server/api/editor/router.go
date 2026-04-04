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
func Register(api *echo.Group, hub *Hub, store EditorStore) {
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

		// Load existing document state and send to the new client.
		state, err := store.Load(c.Request().Context(), documentID)
		if err != nil {
			slog.Error("failed to load document state", "error", err, "document", documentID)
			ws.Close()
			return nil
		}
		if state != nil {
			if err := ws.WriteMessage(websocket.BinaryMessage, state); err != nil {
				slog.Error("failed to send initial state", "error", err, "document", documentID)
				ws.Close()
				return nil
			}
		}

		room := hub.getOrCreateRoom(documentID)
		client := &Client{
			room:       room,
			conn:       ws,
			send:       make(chan []byte, sendBufferSize),
			store:      store,
			documentID: documentID,
		}
		hub.register <- client

		go client.writePump()
		go client.readPump()

		return nil
	})
}
