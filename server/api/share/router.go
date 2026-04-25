package share

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v4"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // origin checking handled by nginx in production
	},
}

// Register mounts the share relay endpoints on the given API group.
func Register(api *echo.Group, hub *Hub) {
	group := api.Group("/share")

	registerTurn(group)

	group.POST("/room", func(c echo.Context) error {
		room, err := hub.CreateRoom()
		if err != nil {
			slog.Error("failed to create share room", "error", err)
			return echo.ErrInternalServerError
		}
		slog.Info("share room created", "room", room.id)
		return c.JSON(http.StatusOK, map[string]string{"roomId": room.id})
	})

	group.GET("/room/:id", func(c echo.Context) error {
		id := c.Param("id")
		if id == "" {
			return echo.ErrBadRequest
		}

		room := hub.GetRoom(id)
		if room == nil {
			return echo.ErrNotFound
		}

		ws, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
		if err != nil {
			slog.Error("share websocket upgrade failed", "error", err, "room", id)
			return nil // Upgrade already wrote the HTTP error response
		}

		peer := &Peer{
			room: room,
			conn: ws,
			send: make(chan []byte, sendBufferSize),
		}

		if !room.join(peer) {
			slog.Info("share room full, rejecting peer", "room", id)
			_ = ws.WriteControl(
				websocket.CloseMessage,
				websocket.FormatCloseMessage(websocket.ClosePolicyViolation, "room full"),
				time.Now().Add(writeWait),
			)
			ws.Close()
			return nil
		}

		slog.Info("share peer connected", "room", id)

		go peer.writePump()
		go peer.readPump(hub)

		return nil
	})
}
