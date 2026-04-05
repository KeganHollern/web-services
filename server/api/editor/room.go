package editor

import (
	"bytes"
	"context"
	"log/slog"
	"sync"

	ycrdt "github.com/skyterra/y-crdt"
)

// Yjs message type prefixes (y-protocols).
const (
	msgSync      = 0
	msgAwareness = 1
)

// Sync message sub-types.
const (
	syncStep2  = 1
	syncUpdate = 2
)

// Room groups clients editing the same document.
// It holds a server-side Y.Doc and Awareness instance that are the
// authoritative state for this document while the room is alive.
type Room struct {
	id         string
	hub        *Hub
	store      EditorStore
	documentID string

	mu        sync.Mutex
	doc       *ycrdt.Doc
	awareness *ycrdt.Awareness
	clients   map[*Client]struct{}

	incoming chan incomingMessage
}

// incomingMessage is a raw binary WS message tagged with the sender.
type incomingMessage struct {
	data   []byte
	sender *Client
}

func newRoom(id string, hub *Hub, store EditorStore) *Room {
	doc := ycrdt.NewDoc(id, true, nil, nil, false)
	return &Room{
		id:         id,
		hub:        hub,
		store:      store,
		documentID: id,
		doc:        doc,
		awareness:  ycrdt.NewAwareness(doc),
		clients:    make(map[*Client]struct{}),
		incoming:   make(chan incomingMessage, 256),
	}
}

// loadState restores the Doc from the store. Call before starting run().
func (r *Room) loadState(ctx context.Context) {
	data, err := r.store.Load(ctx, r.documentID)
	if err != nil {
		slog.Error("failed to load document state", "error", err, "document", r.documentID)
		return
	}
	if data != nil {
		slog.Debug("loaded document state from store", "room", r.id, "size", len(data))
		r.mu.Lock()
		defer r.mu.Unlock()
		ycrdt.ApplyUpdate(r.doc, data, nil)
	} else {
		slog.Debug("no existing state in store", "room", r.id)
	}
}

// persistState saves the current Doc state to the store.
func (r *Room) persistState() {
	r.mu.Lock()
	update := ycrdt.EncodeStateAsUpdate(r.doc, nil)
	r.mu.Unlock()

	slog.Debug("persisting document state", "room", r.id, "size", len(update))

	if err := r.store.Save(context.Background(), r.documentID, update); err != nil {
		slog.Error("failed to persist document state", "error", err, "document", r.documentID)
	}
}

// sendSyncStep1 sends a sync step 1 message to the client so it can respond
// with its own state (and the server can respond with step 2).
func (r *Room) sendSyncStep1(c *Client) {
	r.mu.Lock()
	defer r.mu.Unlock()

	encoder := ycrdt.NewUpdateEncoderV1()
	ycrdt.WriteSyncStep1(encoder, r.doc)
	payload := encoder.ToUint8Array()

	// Wrap in a y-protocols message: [msgSync, ...payload]
	msg := make([]byte, 0, 1+len(payload))
	msg = append(msg, msgSync)
	msg = append(msg, payload...)

	slog.Debug("sending sync step 1", "room", r.id, "size", len(msg))

	select {
	case c.send <- msg:
	default:
	}
}

// sendSyncStep2 sends the full document state to the client as sync step 2.
func (r *Room) sendSyncStep2(c *Client) {
	r.mu.Lock()
	defer r.mu.Unlock()

	// Encode step 2 with an empty state vector so the client gets everything.
	encoder := ycrdt.NewUpdateEncoderV1()
	ycrdt.WriteSyncStep2(encoder, r.doc, nil)
	payload := encoder.ToUint8Array()

	msg := make([]byte, 0, 1+len(payload))
	msg = append(msg, msgSync)
	msg = append(msg, payload...)

	slog.Debug("sending sync step 2", "room", r.id, "size", len(msg))

	select {
	case c.send <- msg:
	default:
	}
}

// sendAwarenessState sends the current awareness state of all known clients.
func (r *Room) sendAwarenessState(c *Client) {
	r.mu.Lock()
	states := r.awareness.GetStates()
	if len(states) == 0 {
		r.mu.Unlock()
		return
	}
	clients := make([]ycrdt.Number, 0, len(states))
	for clientID := range states {
		clients = append(clients, clientID)
	}
	encoded := ycrdt.EncodeAwarenessUpdate(r.awareness, clients, states)
	r.mu.Unlock()

	buf := new(bytes.Buffer)
	ycrdt.WriteVarUint(buf, msgAwareness)
	ycrdt.WriteVarUint8Array(buf, encoded)
	msg := buf.Bytes()

	slog.Debug("sending awareness state", "room", r.id, "clients", len(states), "size", len(msg))

	select {
	case c.send <- msg:
	default:
	}
}

// run processes incoming messages for this room. Exits when the incoming channel is closed.
func (r *Room) run() {
	for msg := range r.incoming {
		r.handleMessage(msg)
	}
}

func (r *Room) handleMessage(msg incomingMessage) {
	if len(msg.data) < 1 {
		return
	}

	msgType := msg.data[0]
	payload := msg.data[1:]

	slog.Debug("received message", "room", r.id, "type", msgType, "size", len(msg.data))

	switch msgType {
	case msgSync:
		r.handleSync(payload, msg.sender)
	case msgAwareness:
		r.handleAwareness(payload, msg.sender)
	default:
		slog.Warn("unknown yjs message type", "type", msgType)
	}
}

func (r *Room) handleSync(payload []byte, sender *Client) {
	if len(payload) < 1 {
		return
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	decoder := ycrdt.NewUpdateDecoderV1(payload)
	encoder := ycrdt.NewUpdateEncoderV1()

	messageType := ycrdt.ReadSyncMessage(decoder, encoder, r.doc, sender)

	slog.Debug("handled sync message", "room", r.id, "type", messageType, "size", len(payload))

	// If ReadSyncMessage produced a reply (e.g. step1 -> step2 reply), send it back.
	reply := encoder.ToUint8Array()
	if len(reply) > 0 {
		replyMsg := make([]byte, 0, 1+len(reply))
		replyMsg = append(replyMsg, msgSync)
		replyMsg = append(replyMsg, reply...)

		select {
		case sender.send <- replyMsg:
		default:
		}
	}

	// If this was a sync update (type 2) or step 2 (type 1), broadcast to other clients.
	// The update has already been applied to the doc by ReadSyncMessage.
	if messageType == syncStep2 || messageType == syncUpdate {
		// Re-encode as a sync update message for broadcast.
		// We forward the raw update payload to other clients.
		r.broadcastToOthers(sender, buildSyncUpdateMsg(payload))
	}
}

// buildSyncUpdateMsg wraps raw sync payload (which starts with the sub-type byte)
// back into a full y-protocols message. Since the payload already came from a client
// as a valid sync message, we forward the original wire bytes.
func buildSyncUpdateMsg(syncPayload []byte) []byte {
	msg := make([]byte, 0, 1+len(syncPayload))
	msg = append(msg, msgSync)
	msg = append(msg, syncPayload...)
	return msg
}

func (r *Room) handleAwareness(payload []byte, sender *Client) {
	// The JS client sends awareness as VarUint8Array (length-prefixed).
	// Strip the length prefix to get the raw awareness bytes that
	// ApplyAwarenessUpdate expects.
	decoder := ycrdt.NewDecoder(payload)
	raw, err := ycrdt.ReadVarUint8Array(decoder)
	if err != nil {
		slog.Warn("failed to decode awareness payload", "error", err)
		return
	}
	data := raw.([]byte)

	slog.Debug("received awareness update", "room", r.id, "size", len(data))

	r.mu.Lock()
	ycrdt.ApplyAwarenessUpdate(r.awareness, data, sender)
	r.mu.Unlock()

	// Re-encode for broadcast with proper framing: [msgType, VarUint8Array].
	buf := new(bytes.Buffer)
	ycrdt.WriteVarUint(buf, msgAwareness)
	ycrdt.WriteVarUint8Array(buf, data)

	r.mu.Lock()
	r.broadcastToOthers(sender, buf.Bytes())
	r.mu.Unlock()
}

// broadcastToOthers sends data to all clients except the sender.
// Caller must hold r.mu.
func (r *Room) broadcastToOthers(sender *Client, data []byte) {
	for client := range r.clients {
		if client == sender {
			continue
		}
		select {
		case client.send <- data:
		default:
			// Client too slow — will be cleaned up.
			go func(c *Client) { r.hub.unregister <- c }(client)
		}
	}
}

