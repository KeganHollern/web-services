package share

import (
	"encoding/json"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v4"
)

func setupShareServer(t *testing.T) (string, *Hub) {
	t.Helper()
	hub := NewHub()
	e := echo.New()
	Register(e.Group("/api"), hub)
	srv := httptest.NewServer(e)
	t.Cleanup(srv.Close)
	return srv.URL, hub
}

func dialRoom(t *testing.T, baseURL, roomID string) *websocket.Conn {
	t.Helper()
	wsURL := "ws" + strings.TrimPrefix(baseURL, "http") + "/api/share/room/" + roomID
	c, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("dial: %v", err)
	}
	t.Cleanup(func() { _ = c.Close() })
	return c
}

func readEnvelope(t *testing.T, c *websocket.Conn) map[string]json.RawMessage {
	t.Helper()
	if err := c.SetReadDeadline(time.Now().Add(2 * time.Second)); err != nil {
		t.Fatalf("set deadline: %v", err)
	}
	typ, data, err := c.ReadMessage()
	if err != nil {
		t.Fatalf("read: %v", err)
	}
	if typ != websocket.TextMessage {
		t.Fatalf("expected text frame, got %d", typ)
	}
	var m map[string]json.RawMessage
	if err := json.Unmarshal(data, &m); err != nil {
		t.Fatalf("unmarshal %q: %v", string(data), err)
	}
	return m
}

func envString(t *testing.T, env map[string]json.RawMessage, key string) string {
	t.Helper()
	raw, ok := env[key]
	if !ok {
		t.Fatalf("envelope missing %q field: %v", key, env)
	}
	var s string
	if err := json.Unmarshal(raw, &s); err != nil {
		t.Fatalf("decode %q: %v", key, err)
	}
	return s
}

func TestJoinEmitsPeerJoinedToExistingPeer(t *testing.T) {
	url, hub := setupShareServer(t)
	room, err := hub.CreateRoom()
	if err != nil {
		t.Fatal(err)
	}

	a := dialRoom(t, url, room.id)
	// Second peer's join should trigger peer-joined to A.
	_ = dialRoom(t, url, room.id)

	env := readEnvelope(t, a)
	if got := envString(t, env, "type"); got != "peer-joined" {
		t.Fatalf("expected peer-joined, got %q", got)
	}
	if envString(t, env, "peerId") == "" {
		t.Fatal("expected non-empty peerId")
	}
}

func TestLeaveEmitsPeerLeftToRemainingPeer(t *testing.T) {
	url, hub := setupShareServer(t)
	room, err := hub.CreateRoom()
	if err != nil {
		t.Fatal(err)
	}

	a := dialRoom(t, url, room.id)
	b := dialRoom(t, url, room.id)

	joined := readEnvelope(t, a)
	bID := envString(t, joined, "peerId")

	// B disconnects cleanly.
	if err := b.WriteMessage(websocket.CloseMessage,
		websocket.FormatCloseMessage(websocket.CloseNormalClosure, "bye")); err != nil {
		t.Fatal(err)
	}
	_ = b.Close()

	left := readEnvelope(t, a)
	if got := envString(t, left, "type"); got != "peer-left" {
		t.Fatalf("expected peer-left, got %q", got)
	}
	if got := envString(t, left, "peerId"); got != bID {
		t.Fatalf("peer-left peerId mismatch: got %q want %q", got, bID)
	}
}

func TestRelayWrapsMessageWithSenderID(t *testing.T) {
	url, hub := setupShareServer(t)
	room, err := hub.CreateRoom()
	if err != nil {
		t.Fatal(err)
	}

	a := dialRoom(t, url, room.id)
	b := dialRoom(t, url, room.id)

	joined := readEnvelope(t, a)
	bID := envString(t, joined, "peerId")

	// B sends an opaque payload. Server must wrap with from=<B's id> and
	// leave the payload bytes untouched.
	out, err := json.Marshal(map[string]any{
		"type":    "message",
		"payload": "opaque-ciphertext",
	})
	if err != nil {
		t.Fatal(err)
	}
	if err := b.WriteMessage(websocket.TextMessage, out); err != nil {
		t.Fatal(err)
	}

	relayed := readEnvelope(t, a)
	if got := envString(t, relayed, "type"); got != "message" {
		t.Fatalf("expected message, got %q", got)
	}
	if got := envString(t, relayed, "from"); got != bID {
		t.Fatalf("from mismatch: got %q want %q", got, bID)
	}
	if got := envString(t, relayed, "payload"); got != "opaque-ciphertext" {
		t.Fatalf("payload mismatch: got %q", got)
	}
}

func TestMalformedEnvelopeSendsErrorBackToSender(t *testing.T) {
	url, hub := setupShareServer(t)
	room, err := hub.CreateRoom()
	if err != nil {
		t.Fatal(err)
	}

	a := dialRoom(t, url, room.id)

	if err := a.WriteMessage(websocket.TextMessage, []byte("{not json")); err != nil {
		t.Fatal(err)
	}

	env := readEnvelope(t, a)
	if got := envString(t, env, "type"); got != "error" {
		t.Fatalf("expected error, got %q", got)
	}
	if envString(t, env, "message") == "" {
		t.Fatal("expected non-empty error message")
	}
}

func TestUnknownEnvelopeTypeSendsError(t *testing.T) {
	url, hub := setupShareServer(t)
	room, err := hub.CreateRoom()
	if err != nil {
		t.Fatal(err)
	}

	a := dialRoom(t, url, room.id)

	out, err := json.Marshal(map[string]any{"type": "floop", "payload": "x"})
	if err != nil {
		t.Fatal(err)
	}
	if err := a.WriteMessage(websocket.TextMessage, out); err != nil {
		t.Fatal(err)
	}

	env := readEnvelope(t, a)
	if got := envString(t, env, "type"); got != "error" {
		t.Fatalf("expected error, got %q", got)
	}
}

func TestRelayHonoursToField(t *testing.T) {
	url, hub := setupShareServer(t)
	room, err := hub.CreateRoom()
	if err != nil {
		t.Fatal(err)
	}

	a := dialRoom(t, url, room.id)
	b := dialRoom(t, url, room.id)

	// Drain A's peer-joined so the next read isolates the relay (or its absence).
	_ = readEnvelope(t, a)

	out, err := json.Marshal(map[string]any{
		"type":    "message",
		"to":      "nonexistent-peer",
		"payload": "should-not-arrive",
	})
	if err != nil {
		t.Fatal(err)
	}
	if err := b.WriteMessage(websocket.TextMessage, out); err != nil {
		t.Fatal(err)
	}

	if err := a.SetReadDeadline(time.Now().Add(300 * time.Millisecond)); err != nil {
		t.Fatal(err)
	}
	if _, _, err := a.ReadMessage(); err == nil {
		t.Fatal("expected timeout; A must not receive messages targeted at another peer")
	}
}

func TestThirdPeerRejectedWithRoomFull(t *testing.T) {
	url, hub := setupShareServer(t)
	room, err := hub.CreateRoom()
	if err != nil {
		t.Fatal(err)
	}

	_ = dialRoom(t, url, room.id)
	_ = dialRoom(t, url, room.id)

	wsURL := "ws" + strings.TrimPrefix(url, "http") + "/api/share/room/" + room.id
	c, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("dial: %v", err)
	}
	defer c.Close()

	if err := c.SetReadDeadline(time.Now().Add(2 * time.Second)); err != nil {
		t.Fatal(err)
	}
	_, _, err = c.ReadMessage()
	if err == nil {
		t.Fatal("expected close frame for third peer")
	}
	closeErr, ok := err.(*websocket.CloseError)
	if !ok {
		t.Fatalf("expected *websocket.CloseError, got %T: %v", err, err)
	}
	if closeErr.Code != websocket.ClosePolicyViolation {
		t.Fatalf("expected ClosePolicyViolation, got %d", closeErr.Code)
	}
}
