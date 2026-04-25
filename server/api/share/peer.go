package share

import (
	"encoding/json"
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

// Peer is a single WebSocket connection in a room. Every peer carries a
// server-assigned `id` used as the routing identity in envelope `from`/`to`
// fields.
type Peer struct {
	id   string
	room *Room
	conn *websocket.Conn
	send chan []byte

	bytesIn  int64
	bytesOut int64
}

// readPump reads envelope frames from the WebSocket and hands them to the
// room for routing. Only TextMessage frames are processed; the envelope
// `payload` field is forwarded as an opaque json.RawMessage and never
// decoded, parsed, or logged.
func (p *Peer) readPump(hub *Hub) {
	defer func() {
		p.room.leave(hub, p)
		p.conn.Close()
		slog.Info("share peer disconnected",
			"room", p.room.id,
			"peer", p.id,
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

		if typ != websocket.TextMessage {
			// The signaling protocol is JSON-over-text. Binary frames (or
			// anything else) are ignored rather than forwarded blindly.
			continue
		}

		var env clientEnvelope
		if err := json.Unmarshal(data, &env); err != nil {
			p.sendError("malformed envelope")
			continue
		}

		switch env.Type {
		case "message":
			p.room.relay(p, env.To, env.Payload)
		default:
			p.sendError("unknown envelope type")
		}
	}
}

// writePump pulls envelope bytes from the send channel and writes them to
// the peer as TextMessage frames. All server-generated envelopes are JSON.
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
			if err := p.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
					slog.Error("share websocket write error", "error", err, "room", p.room.id)
				}
				return
			}
			p.bytesOut += int64(len(msg))
		case <-ticker.C:
			p.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := p.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// sendError enqueues a server-originated error envelope to this peer.
// The peer is still alive (we're inside readPump), so writing to its
// send channel without the room lock is safe.
func (p *Peer) sendError(msg string) {
	data, err := json.Marshal(errorEnvelope{Type: "error", Message: msg})
	if err != nil {
		return
	}
	deliver(p, data, p.room.id)
}
