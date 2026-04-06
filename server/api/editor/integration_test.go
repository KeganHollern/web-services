package editor

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v4"
	ycrdt "github.com/skyterra/y-crdt"
)

// --- Test helpers ---

// testServer wraps an httptest.Server with the Hub for cleanup.
type testServer struct {
	URL    string
	Server *httptest.Server
	Hub    *Hub
}

func newTestServer(t *testing.T) *testServer {
	t.Helper()
	store := NewMemoryStore()
	hub := NewHub(store)

	e := echo.New()
	api := e.Group("/api")
	Register(api, hub)

	srv := httptest.NewServer(e)
	return &testServer{
		URL:    srv.URL,
		Server: srv,
		Hub:    hub,
	}
}

func (ts *testServer) close() {
	ts.Server.Close()
}

// connectWS connects a WebSocket client to the editor endpoint for the given doc ID.
func connectWS(t *testing.T, serverURL, docID string) *websocket.Conn {
	t.Helper()
	wsURL := "ws" + strings.TrimPrefix(serverURL, "http") + "/api/editor/ws/" + docID
	dialer := websocket.Dialer{}
	conn, resp, err := dialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("WebSocket dial failed: %v", err)
	}
	if resp.StatusCode != http.StatusSwitchingProtocols {
		t.Fatalf("expected 101, got %d", resp.StatusCode)
	}
	return conn
}

// wsMessage is a decoded WebSocket message with its outer type and payload.
type wsMessage struct {
	raw     []byte
	msgType uint64 // 0=sync, 1=awareness
	payload []byte // everything after the first varuint
}

// readMessage reads a binary WS message and decodes the outer message type.
func readMessage(t *testing.T, ws *websocket.Conn) wsMessage {
	t.Helper()
	ws.SetReadDeadline(time.Now().Add(5 * time.Second))
	_, raw, err := ws.ReadMessage()
	if err != nil {
		t.Fatalf("readMessage failed: %v", err)
	}
	decoder := ycrdt.NewDecoder(raw)
	msgType := ycrdt.ReadVarUint(decoder)
	remaining := decoder.Bytes()
	return wsMessage{raw: raw, msgType: msgType, payload: remaining}
}

// readSyncMessage reads the next WS message, asserts it's a sync message, and returns the sync sub-type.
func readSyncMessage(t *testing.T, ws *websocket.Conn) (subType uint64, payload []byte, raw []byte) {
	t.Helper()
	msg := readMessage(t, ws)
	if msg.msgType != 0 {
		t.Fatalf("expected sync message (type 0), got type %d", msg.msgType)
	}
	decoder := ycrdt.NewDecoder(msg.payload)
	sub := ycrdt.ReadVarUint(decoder)
	return sub, decoder.Bytes(), msg.raw
}

// sendSyncStep1 sends a properly formatted sync step 1 from a client doc.
func sendSyncStep1(t *testing.T, ws *websocket.Conn, doc *ycrdt.Doc) {
	t.Helper()
	enc := ycrdt.NewUpdateEncoderV1()
	ycrdt.WriteSyncStep1(enc, doc)
	payload := enc.ToUint8Array()

	msg := make([]byte, 0, 1+len(payload))
	msg = append(msg, 0) // msgSync
	msg = append(msg, payload...)

	if err := ws.WriteMessage(websocket.BinaryMessage, msg); err != nil {
		t.Fatalf("sendSyncStep1 failed: %v", err)
	}
}

// sendUpdate sends a Yjs update wrapped as a sync update message.
func sendUpdate(t *testing.T, ws *websocket.Conn, update []byte) {
	t.Helper()
	enc := ycrdt.NewUpdateEncoderV1()
	ycrdt.WriteUpdate(enc, update)
	payload := enc.ToUint8Array()

	msg := make([]byte, 0, 1+len(payload))
	msg = append(msg, 0) // msgSync
	msg = append(msg, payload...)

	if err := ws.WriteMessage(websocket.BinaryMessage, msg); err != nil {
		t.Fatalf("sendUpdate failed: %v", err)
	}
}

// sendAwareness sends an awareness update wrapped in VarUint8Array framing.
func sendAwareness(t *testing.T, ws *websocket.Conn, awarenessData []byte) {
	t.Helper()
	buf := new(bytes.Buffer)
	ycrdt.WriteVarUint(buf, 1) // msgAwareness
	ycrdt.WriteVarUint8Array(buf, awarenessData)

	if err := ws.WriteMessage(websocket.BinaryMessage, buf.Bytes()); err != nil {
		t.Fatalf("sendAwareness failed: %v", err)
	}
}

// completeHandshake reads the initial sync step 1, sync step 2, and (optionally) awareness
// messages from the server. Returns the raw step 2 update payload.
func completeHandshake(t *testing.T, ws *websocket.Conn) []byte {
	t.Helper()

	// Server sends: sync step 1, sync step 2, awareness (if any states exist).
	// Read sync step 1.
	sub1, _, _ := readSyncMessage(t, ws)
	if sub1 != uint64(ycrdt.MessageYjsSyncStep1) {
		t.Fatalf("expected sync step 1, got sub-type %d", sub1)
	}

	// Read sync step 2.
	sub2, step2Payload, _ := readSyncMessage(t, ws)
	if sub2 != uint64(ycrdt.MessageYjsSyncStep2) {
		t.Fatalf("expected sync step 2, got sub-type %d", sub2)
	}

	// The server may also send an awareness message. Try to read it with a short timeout.
	ws.SetReadDeadline(time.Now().Add(200 * time.Millisecond))
	_, _, err := ws.ReadMessage()
	if err != nil {
		// Timeout is expected if no awareness state exists — that's fine.
	}
	ws.SetReadDeadline(time.Time{}) // reset

	return step2Payload
}

// extractUpdateFromStep2Payload extracts the raw Yjs update bytes from a sync step 2 payload.
// The payload has already had the sub-type varuint stripped by readSyncMessage.
func extractUpdateFromStep2Payload(t *testing.T, payload []byte) []byte {
	t.Helper()
	decoder := ycrdt.NewDecoder(payload)
	updateRaw, err := ycrdt.ReadVarUint8Array(decoder)
	if err != nil {
		t.Fatalf("failed to read update from step 2: %v", err)
	}
	return updateRaw.([]byte)
}

// --- Integration Tests ---

func TestIntegration_SingleClientConnectAndSync(t *testing.T) {
	ts := newTestServer(t)
	defer ts.close()

	ws := connectWS(t, ts.URL, "test-doc")
	defer ws.Close()

	// Read sync step 1: format should be [0, 0, ...]
	msg1 := readMessage(t, ws)
	if msg1.msgType != 0 {
		t.Fatalf("first message should be sync (0), got %d", msg1.msgType)
	}
	decoder := ycrdt.NewDecoder(msg1.payload)
	subType := ycrdt.ReadVarUint(decoder)
	if subType != 0 {
		t.Fatalf("expected sync step 1 (sub-type 0), got %d", subType)
	}

	// Read sync step 2: format should be [0, 1, ...]
	msg2 := readMessage(t, ws)
	if msg2.msgType != 0 {
		t.Fatalf("second message should be sync (0), got %d", msg2.msgType)
	}
	decoder2 := ycrdt.NewDecoder(msg2.payload)
	subType2 := ycrdt.ReadVarUint(decoder2)
	if subType2 != 1 {
		t.Fatalf("expected sync step 2 (sub-type 1), got %d", subType2)
	}

	// The server may also send awareness state — drain it if present.
	ws.SetReadDeadline(time.Now().Add(200 * time.Millisecond))
	ws.ReadMessage() // ignore awareness or timeout
	ws.SetReadDeadline(time.Time{})

	// Now send a sync step 1 from the client.
	clientDoc := ycrdt.NewDoc("client", true, ycrdt.DefaultGCFilter, nil, false)
	sendSyncStep1(t, ws, clientDoc)

	// Read the server's sync step 2 reply.
	sub, _, _ := readSyncMessage(t, ws)
	if sub != uint64(ycrdt.MessageYjsSyncStep2) {
		t.Fatalf("expected step 2 reply, got sub-type %d", sub)
	}
}

func TestIntegration_TwoClientsSync(t *testing.T) {
	ts := newTestServer(t)
	defer ts.close()

	// Client A connects, completes handshake.
	wsA := connectWS(t, ts.URL, "sync-doc")
	defer wsA.Close()
	completeHandshake(t, wsA)

	// Client A sends an update with text "hello".
	clientDocA := ycrdt.NewDoc("clientA", true, ycrdt.DefaultGCFilter, nil, false)
	clientDocA.ClientID = 500
	textA := clientDocA.GetText("content")
	textA.Insert(0, "hello", nil)
	updateA := ycrdt.EncodeStateAsUpdate(clientDocA, nil)
	sendUpdate(t, wsA, updateA)

	// Small delay for the server to process.
	time.Sleep(100 * time.Millisecond)

	// Client B connects.
	wsB := connectWS(t, ts.URL, "sync-doc")
	defer wsB.Close()

	// Client B should receive sync step 2 containing the "hello" text.
	step2Payload := completeHandshake(t, wsB)
	update := extractUpdateFromStep2Payload(t, step2Payload)

	verifyDoc := ycrdt.NewDoc("verify", true, ycrdt.DefaultGCFilter, nil, false)
	ycrdt.ApplyUpdate(verifyDoc, update, nil)

	result := verifyDoc.GetText("content").ToString()
	if result != "hello" {
		t.Fatalf("expected Client B to receive 'hello', got %q", result)
	}
}

func TestIntegration_ContentPersistsAcrossReconnects(t *testing.T) {
	ts := newTestServer(t)
	defer ts.close()

	// Client connects and sends text.
	ws1 := connectWS(t, ts.URL, "persist-doc")
	completeHandshake(t, ws1)

	clientDoc := ycrdt.NewDoc("client", true, ycrdt.DefaultGCFilter, nil, false)
	clientDoc.ClientID = 600
	text := clientDoc.GetText("content")
	text.Insert(0, "persist-test", nil)
	update := ycrdt.EncodeStateAsUpdate(clientDoc, nil)
	sendUpdate(t, ws1, update)

	time.Sleep(100 * time.Millisecond)

	// Client disconnects.
	ws1.WriteMessage(websocket.CloseMessage,
		websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
	ws1.Close()

	// Wait for room cleanup (empty room -> persist -> remove).
	time.Sleep(300 * time.Millisecond)

	// New client connects to same doc.
	ws2 := connectWS(t, ts.URL, "persist-doc")
	defer ws2.Close()

	step2Payload := completeHandshake(t, ws2)
	updateBytes := extractUpdateFromStep2Payload(t, step2Payload)

	verifyDoc := ycrdt.NewDoc("verify", true, ycrdt.DefaultGCFilter, nil, false)
	ycrdt.ApplyUpdate(verifyDoc, updateBytes, nil)

	result := verifyDoc.GetText("content").ToString()
	if result != "persist-test" {
		t.Fatalf("expected 'persist-test', got %q", result)
	}
}

func TestIntegration_AwarenessBroadcast(t *testing.T) {
	ts := newTestServer(t)
	defer ts.close()

	// Client A and B connect.
	wsA := connectWS(t, ts.URL, "awareness-doc")
	defer wsA.Close()
	completeHandshake(t, wsA)

	wsB := connectWS(t, ts.URL, "awareness-doc")
	defer wsB.Close()
	completeHandshake(t, wsB)

	// Client A sends awareness update with cursor position.
	awDoc := ycrdt.NewDoc("aw-a", true, ycrdt.DefaultGCFilter, nil, false)
	awDoc.ClientID = 700
	aw := ycrdt.NewAwareness(awDoc)
	aw.SetLocalState(ycrdt.Object{"cursor": float64(42)})

	clients := []ycrdt.Number{700}
	states := aw.GetStates()
	encoded := ycrdt.EncodeAwarenessUpdate(aw, clients, states)

	sendAwareness(t, wsA, encoded)

	// Client B should receive the awareness broadcast.
	msg := readMessage(t, wsB)
	if msg.msgType != 1 {
		t.Fatalf("expected awareness message (type 1), got %d", msg.msgType)
	}

	// Decode and verify the awareness data.
	decoder := ycrdt.NewDecoder(msg.payload)
	awarenessRaw, err := ycrdt.ReadVarUint8Array(decoder)
	if err != nil {
		t.Fatalf("failed to read awareness payload: %v", err)
	}
	awarenessBytes := awarenessRaw.([]byte)

	// Apply to a fresh awareness instance and verify.
	verifyDoc := ycrdt.NewDoc("verify-aw", true, ycrdt.DefaultGCFilter, nil, false)
	verifyDoc.ClientID = 800
	verifyAw := ycrdt.NewAwareness(verifyDoc)
	ycrdt.ApplyAwarenessUpdate(verifyAw, awarenessBytes, nil)

	verifyStates := verifyAw.GetStates()
	state, ok := verifyStates[700]
	if !ok {
		t.Fatal("expected awareness state for client 700")
	}
	cursor, ok := state["cursor"]
	if !ok {
		t.Fatal("expected cursor field in awareness state")
	}
	if cursor != float64(42) {
		t.Fatalf("expected cursor 42, got %v", cursor)
	}
}

func TestIntegration_ConcurrentEdits(t *testing.T) {
	ts := newTestServer(t)
	defer ts.close()

	// Client A and B connect.
	wsA := connectWS(t, ts.URL, "concurrent-doc")
	defer wsA.Close()
	completeHandshake(t, wsA)

	wsB := connectWS(t, ts.URL, "concurrent-doc")
	defer wsB.Close()
	completeHandshake(t, wsB)

	// Both clients send updates concurrently.
	var wg sync.WaitGroup
	wg.Add(2)

	go func() {
		defer wg.Done()
		docA := ycrdt.NewDoc("a", true, ycrdt.DefaultGCFilter, nil, false)
		docA.ClientID = 900
		textA := docA.GetText("content")
		textA.Insert(0, "AAA", nil)
		updateA := ycrdt.EncodeStateAsUpdate(docA, nil)
		sendUpdate(t, wsA, updateA)
	}()

	go func() {
		defer wg.Done()
		docB := ycrdt.NewDoc("b", true, ycrdt.DefaultGCFilter, nil, false)
		docB.ClientID = 901
		textB := docB.GetText("content")
		textB.Insert(0, "BBB", nil)
		updateB := ycrdt.EncodeStateAsUpdate(docB, nil)
		sendUpdate(t, wsB, updateB)
	}()

	wg.Wait()
	time.Sleep(200 * time.Millisecond)

	// Connect a third client to get the merged state.
	wsC := connectWS(t, ts.URL, "concurrent-doc")
	defer wsC.Close()

	step2Payload := completeHandshake(t, wsC)
	updateBytes := extractUpdateFromStep2Payload(t, step2Payload)

	verifyDoc := ycrdt.NewDoc("verify", true, ycrdt.DefaultGCFilter, nil, false)
	ycrdt.ApplyUpdate(verifyDoc, updateBytes, nil)

	result := verifyDoc.GetText("content").ToString()

	// Both "AAA" and "BBB" should be present (order may vary due to CRDT).
	if !strings.Contains(result, "AAA") {
		t.Fatalf("expected result to contain 'AAA', got %q", result)
	}
	if !strings.Contains(result, "BBB") {
		t.Fatalf("expected result to contain 'BBB', got %q", result)
	}
	if len(result) != 6 {
		t.Fatalf("expected 6 chars (AAA+BBB), got %d: %q", len(result), result)
	}
}

func TestIntegration_CleanDisconnect(t *testing.T) {
	ts := newTestServer(t)
	defer ts.close()

	ws := connectWS(t, ts.URL, "close-doc")
	completeHandshake(t, ws)

	// Send some state so persistence has something to save.
	doc := ycrdt.NewDoc("c", true, ycrdt.DefaultGCFilter, nil, false)
	doc.ClientID = 1000
	text := doc.GetText("content")
	text.Insert(0, "close-test", nil)
	update := ycrdt.EncodeStateAsUpdate(doc, nil)
	sendUpdate(t, ws, update)
	time.Sleep(100 * time.Millisecond)

	// Clean close with code 1000.
	ws.WriteMessage(websocket.CloseMessage,
		websocket.FormatCloseMessage(websocket.CloseNormalClosure, "bye"))
	ws.Close()

	time.Sleep(300 * time.Millisecond)

	// Reconnect — should get persisted state.
	ws2 := connectWS(t, ts.URL, "close-doc")
	defer ws2.Close()

	step2Payload := completeHandshake(t, ws2)
	updateBytes := extractUpdateFromStep2Payload(t, step2Payload)

	verifyDoc := ycrdt.NewDoc("v", true, ycrdt.DefaultGCFilter, nil, false)
	ycrdt.ApplyUpdate(verifyDoc, updateBytes, nil)

	result := verifyDoc.GetText("content").ToString()
	if result != "close-test" {
		t.Fatalf("expected 'close-test' after clean disconnect, got %q", result)
	}
}

func TestIntegration_AbnormalDisconnect(t *testing.T) {
	ts := newTestServer(t)
	defer ts.close()

	ws := connectWS(t, ts.URL, "abnormal-doc")
	completeHandshake(t, ws)

	doc := ycrdt.NewDoc("c", true, ycrdt.DefaultGCFilter, nil, false)
	doc.ClientID = 1100
	text := doc.GetText("content")
	text.Insert(0, "abnormal-test", nil)
	update := ycrdt.EncodeStateAsUpdate(doc, nil)
	sendUpdate(t, ws, update)
	time.Sleep(100 * time.Millisecond)

	// Abnormal disconnect: just drop the connection without close handshake.
	ws.Close()

	time.Sleep(300 * time.Millisecond)

	// Reconnect — room should have cleaned up and persisted.
	ws2 := connectWS(t, ts.URL, "abnormal-doc")
	defer ws2.Close()

	step2Payload := completeHandshake(t, ws2)
	updateBytes := extractUpdateFromStep2Payload(t, step2Payload)

	verifyDoc := ycrdt.NewDoc("v", true, ycrdt.DefaultGCFilter, nil, false)
	ycrdt.ApplyUpdate(verifyDoc, updateBytes, nil)

	result := verifyDoc.GetText("content").ToString()
	if result != "abnormal-test" {
		t.Fatalf("expected 'abnormal-test' after abnormal disconnect, got %q", result)
	}
}
