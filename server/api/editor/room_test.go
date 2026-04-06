package editor

import (
	"bytes"
	"context"
	"testing"

	ycrdt "github.com/skyterra/y-crdt"
)

// newTestRoom creates a Room backed by MemoryStore for testing.
func newTestRoom(id string) *Room {
	store := NewMemoryStore()
	hub := NewHub(store)
	return newRoom(id, hub, store)
}

// mockClient creates a Client attached to the given room with a buffered send channel.
func mockClient(room *Room) *Client {
	return &Client{
		room: room,
		send: make(chan []byte, 64),
	}
}

// drainOne reads a single message from the client send channel (non-blocking).
func drainOne(c *Client) []byte {
	select {
	case msg := <-c.send:
		return msg
	default:
		return nil
	}
}

// --- Sync Step 1 ---

func TestSendSyncStep1_Format(t *testing.T) {
	room := newTestRoom("test-doc")
	c := mockClient(room)

	room.sendSyncStep1(c)

	msg := drainOne(c)
	if msg == nil {
		t.Fatal("expected sync step 1 message")
	}
	// Message format: [msgSync(0), syncStep1SubType(0), VarUint8Array(stateVector)]
	if msg[0] != msgSync {
		t.Fatalf("expected msgSync (0), got %d", msg[0])
	}

	// The payload (after msgSync prefix) should be decodable as a sync message.
	payload := msg[1:]
	decoder := ycrdt.NewUpdateDecoderV1(payload)
	encoder := ycrdt.NewUpdateEncoderV1()
	msgType := ycrdt.ReadSyncMessage(decoder, encoder, ycrdt.NewDoc("verify", true, ycrdt.DefaultGCFilter, nil, false), nil)
	if msgType != ycrdt.MessageYjsSyncStep1 {
		t.Fatalf("expected MessageYjsSyncStep1 (0), got %d", msgType)
	}

	// ReadSyncMessage should have produced a step 2 reply.
	reply := encoder.ToUint8Array()
	if len(reply) == 0 {
		t.Fatal("expected step 2 reply from ReadSyncMessage when processing step 1")
	}
}

func TestSendSyncStep1_DecodableByUpdateDecoder(t *testing.T) {
	room := newTestRoom("test-doc")
	c := mockClient(room)

	room.sendSyncStep1(c)

	msg := drainOne(c)
	if msg == nil {
		t.Fatal("expected message")
	}

	// Strip msgSync prefix, decode using UpdateDecoderV1.
	payload := msg[1:]
	decoder := ycrdt.NewUpdateDecoderV1(payload)
	// First varuint should be the sync sub-type (0 = step 1).
	subType := ycrdt.ReadVarUint(decoder.RestDecoder)
	if subType != 0 {
		t.Fatalf("expected sync step 1 sub-type (0), got %d", subType)
	}

	// Next is a VarUint8Array containing the state vector.
	svRaw, err := ycrdt.ReadVarUint8Array(decoder.RestDecoder)
	if err != nil {
		t.Fatalf("failed to read state vector: %v", err)
	}
	sv := svRaw.([]byte)
	if sv == nil {
		t.Fatal("state vector should not be nil")
	}
}

// --- Sync Step 2 ---

func TestSendSyncStep2_Format(t *testing.T) {
	room := newTestRoom("test-doc")
	c := mockClient(room)

	room.sendSyncStep2(c)

	msg := drainOne(c)
	if msg == nil {
		t.Fatal("expected sync step 2 message")
	}
	if msg[0] != msgSync {
		t.Fatalf("expected msgSync (0), got %d", msg[0])
	}

	// The payload should decode as a sync step 2.
	payload := msg[1:]
	decoder := ycrdt.NewUpdateDecoderV1(payload)
	subType := ycrdt.ReadVarUint(decoder.RestDecoder)
	if subType != uint64(ycrdt.MessageYjsSyncStep2) {
		t.Fatalf("expected sync step 2 sub-type (1), got %d", subType)
	}
}

func TestSendSyncStep2_ApplicableToFreshDoc(t *testing.T) {
	room := newTestRoom("test-doc")
	c := mockClient(room)

	room.sendSyncStep2(c)

	msg := drainOne(c)
	payload := msg[1:]

	// Decode the update from step 2.
	decoder := ycrdt.NewUpdateDecoderV1(payload)
	ycrdt.ReadVarUint(decoder.RestDecoder) // skip sub-type
	updateRaw, err := ycrdt.ReadVarUint8Array(decoder.RestDecoder)
	if err != nil {
		t.Fatalf("failed to read update: %v", err)
	}
	update := updateRaw.([]byte)

	// Apply to a fresh doc — should not panic.
	freshDoc := ycrdt.NewDoc("fresh", true, ycrdt.DefaultGCFilter, nil, false)
	ycrdt.ApplyUpdate(freshDoc, update, nil)
}

// --- handleSync ---

func TestHandleSync_Step1ProducesStep2Reply(t *testing.T) {
	room := newTestRoom("test-doc")
	sender := mockClient(room)

	// Build a sync step 1 message from a client doc.
	clientDoc := ycrdt.NewDoc("client", true, ycrdt.DefaultGCFilter, nil, false)
	enc := ycrdt.NewUpdateEncoderV1()
	ycrdt.WriteSyncStep1(enc, clientDoc)
	step1Payload := enc.ToUint8Array()

	room.handleSync(step1Payload, sender)

	// The sender should receive a step 2 reply.
	reply := drainOne(sender)
	if reply == nil {
		t.Fatal("expected step 2 reply")
	}
	if reply[0] != msgSync {
		t.Fatalf("expected msgSync prefix, got %d", reply[0])
	}

	// Verify the reply is a step 2.
	decoder := ycrdt.NewUpdateDecoderV1(reply[1:])
	subType := ycrdt.ReadVarUint(decoder.RestDecoder)
	if subType != uint64(ycrdt.MessageYjsSyncStep2) {
		t.Fatalf("expected step 2 sub-type (1), got %d", subType)
	}
}

func TestHandleSync_UpdateAppliedToDoc(t *testing.T) {
	room := newTestRoom("test-doc")
	sender := mockClient(room)

	// Create a client doc with some text.
	clientDoc := ycrdt.NewDoc("client", true, ycrdt.DefaultGCFilter, nil, false)
	clientDoc.ClientID = 999
	text := clientDoc.GetText("content")
	text.Insert(0, "hello", nil)
	update := ycrdt.EncodeStateAsUpdate(clientDoc, nil)

	// Build a sync update message.
	enc := ycrdt.NewUpdateEncoderV1()
	ycrdt.WriteUpdate(enc, update)
	updatePayload := enc.ToUint8Array()

	room.handleSync(updatePayload, sender)

	// The room's doc should now contain the text.
	room.mu.Lock()
	roomText := room.doc.GetText("content")
	result := roomText.ToString()
	room.mu.Unlock()

	if result != "hello" {
		t.Fatalf("expected 'hello', got %q", result)
	}
}

// --- Awareness ---

func TestHandleAwareness_StripsLengthPrefix(t *testing.T) {
	room := newTestRoom("test-doc")
	sender := mockClient(room)
	other := mockClient(room)

	room.mu.Lock()
	room.clients[sender] = struct{}{}
	room.clients[other] = struct{}{}
	room.mu.Unlock()

	// Create awareness data.
	awarenessDoc := ycrdt.NewDoc("aw-client", true, ycrdt.DefaultGCFilter, nil, false)
	awarenessDoc.ClientID = 42
	aw := ycrdt.NewAwareness(awarenessDoc)
	aw.SetLocalState(ycrdt.Object{"cursor": float64(5)})

	clients := []ycrdt.Number{42}
	states := aw.GetStates()
	encoded := ycrdt.EncodeAwarenessUpdate(aw, clients, states)

	// Wrap as VarUint8Array (how the JS client sends it).
	buf := new(bytes.Buffer)
	ycrdt.WriteVarUint8Array(buf, encoded)
	payload := buf.Bytes()

	room.handleAwareness(payload, sender)

	// The other client should receive a broadcast.
	broadcast := drainOne(other)
	if broadcast == nil {
		t.Fatal("expected awareness broadcast to other client")
	}

	// Sender should NOT receive the broadcast.
	selfMsg := drainOne(sender)
	if selfMsg != nil {
		t.Fatal("sender should not receive its own awareness broadcast")
	}
}

func TestSendAwarenessState_WrapFormat(t *testing.T) {
	room := newTestRoom("test-doc")

	// Set up awareness state.
	room.mu.Lock()
	room.awareness.SetLocalState(ycrdt.Object{"cursor": float64(10)})
	room.mu.Unlock()

	c := mockClient(room)
	room.sendAwarenessState(c)

	msg := drainOne(c)
	if msg == nil {
		t.Fatal("expected awareness state message")
	}

	// Decode: first byte should be msgAwareness (1) encoded as varuint.
	decoder := ycrdt.NewDecoder(msg)
	msgType := ycrdt.ReadVarUint(decoder)
	if msgType != msgAwareness {
		t.Fatalf("expected msgAwareness (1), got %d", msgType)
	}

	// Next should be a VarUint8Array.
	awarenessRaw, err := ycrdt.ReadVarUint8Array(decoder)
	if err != nil {
		t.Fatalf("failed to read awareness data: %v", err)
	}
	data := awarenessRaw.([]byte)
	if len(data) == 0 {
		t.Fatal("awareness data should not be empty")
	}
}

func TestAwareness_RoundTrip(t *testing.T) {
	// Encode awareness on one instance, apply on another.
	doc1 := ycrdt.NewDoc("a", true, ycrdt.DefaultGCFilter, nil, false)
	doc1.ClientID = 1
	aw1 := ycrdt.NewAwareness(doc1)
	aw1.SetLocalState(ycrdt.Object{"user": "alice", "cursor": float64(42)})

	clients := []ycrdt.Number{1}
	states := aw1.GetStates()
	encoded := ycrdt.EncodeAwarenessUpdate(aw1, clients, states)

	doc2 := ycrdt.NewDoc("b", true, ycrdt.DefaultGCFilter, nil, false)
	doc2.ClientID = 2
	aw2 := ycrdt.NewAwareness(doc2)

	ycrdt.ApplyAwarenessUpdate(aw2, encoded, nil)

	states2 := aw2.GetStates()
	state, ok := states2[1]
	if !ok {
		t.Fatal("expected awareness state for client 1")
	}
	if state["user"] != "alice" {
		t.Fatalf("expected user 'alice', got %v", state["user"])
	}
}

// --- Persist / Load ---

func TestPersistState_LoadState_RoundTrip(t *testing.T) {
	store := NewMemoryStore()
	hub := NewHub(store)

	// Create room, insert text, persist.
	room1 := newRoom("persist-test", hub, store)
	room1.doc.ClientID = 100
	text1 := room1.doc.GetText("content")
	text1.Insert(0, "persisted-data", nil)
	room1.persistState()

	// Create new room for same document, load state.
	room2 := newRoom("persist-test", hub, store)
	room2.loadState(context.Background())

	room2.mu.Lock()
	text2 := room2.doc.GetText("content")
	result := text2.ToString()
	room2.mu.Unlock()

	if result != "persisted-data" {
		t.Fatalf("expected 'persisted-data', got %q", result)
	}
}

// --- Broadcast ---

func TestBroadcastToOthers_ExcludesSender(t *testing.T) {
	room := newTestRoom("test-doc")
	sender := mockClient(room)
	other1 := mockClient(room)
	other2 := mockClient(room)

	room.mu.Lock()
	room.clients[sender] = struct{}{}
	room.clients[other1] = struct{}{}
	room.clients[other2] = struct{}{}
	room.mu.Unlock()

	data := []byte("test-broadcast")
	room.mu.Lock()
	room.broadcastToOthers(sender, data)
	room.mu.Unlock()

	msg1 := drainOne(other1)
	msg2 := drainOne(other2)
	senderMsg := drainOne(sender)

	if msg1 == nil || msg2 == nil {
		t.Fatal("expected both other clients to receive broadcast")
	}
	if senderMsg != nil {
		t.Fatal("sender should not receive its own broadcast")
	}
	if !bytes.Equal(msg1, data) || !bytes.Equal(msg2, data) {
		t.Fatal("broadcast data mismatch")
	}
}

// --- handleMessage ---

func TestHandleMessage_EmptyData(t *testing.T) {
	room := newTestRoom("test-doc")
	sender := mockClient(room)

	// Should not panic on empty data.
	room.handleMessage(incomingMessage{data: []byte{}, sender: sender})
}

func TestHandleMessage_UnknownType(t *testing.T) {
	room := newTestRoom("test-doc")
	sender := mockClient(room)

	// Unknown message type 99 — should not panic.
	room.handleMessage(incomingMessage{data: []byte{99, 1, 2, 3}, sender: sender})

	// No reply expected.
	msg := drainOne(sender)
	if msg != nil {
		t.Fatal("no reply expected for unknown message type")
	}
}
