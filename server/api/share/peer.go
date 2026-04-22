package share

import (
	"log/slog"
	"time"

	"github.com/gorilla/websocket"
)

const (
	sendBufferSize = 32
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 1 * 1024 * 1024 // 1 MiB — signaling frames are small; media flows P2P
)

// frame carries a message across the send channel along with its WS opcode
// so text/binary framing is preserved verbatim through the relay.
type frame struct {
	typ  int
	data []byte
}

// Peer is a single WebSocket connection in a room.
type Peer struct {
	room *Room
	conn *websocket.Conn
	send chan frame

	bytesIn  int64
	bytesOut int64
}

// readPump reads frames from the WebSocket and hands them to the room for
// relay. Payload bytes are never decoded or logged.
func (p *Peer) readPump(hub *Hub) {
	defer func() {
		p.room.leave(hub, p)
		p.conn.Close()
		slog.Info("share peer disconnected",
			"room", p.room.id,
			"bytes_in", p.bytesIn,
			"bytes_out", p.bytesOut,
		)
	}()

	p.conn.SetReadLimit(maxMessageSize)
	p.conn.SetReadDeadline(time.Now().Add(pongWait))
	p.conn.SetPongHandler(func(string) error {
		p.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		typ, data, err := p.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				slog.Error("share websocket read error", "error", err, "room", p.room.id)
			}
			return
		}
		p.bytesIn += int64(len(data))
		p.room.relay(p, typ, data)
	}
}

// writePump pulls frames from the send channel and writes them to the peer.
func (p *Peer) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		p.conn.Close()
	}()

	for {
		select {
		case msg, ok := <-p.send:
			p.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				p.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := p.conn.WriteMessage(msg.typ, msg.data); err != nil {
				slog.Error("share websocket write error", "error", err, "room", p.room.id)
				return
			}
			p.bytesOut += int64(len(msg.data))
		case <-ticker.C:
			p.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := p.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
