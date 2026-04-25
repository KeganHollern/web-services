package share

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/gorilla/websocket"
)

// TestFullHandshakeIntegration walks a full sharer→viewer signaling exchange
// through the share hub: peer-joined, relayed message with `from`, peer-left.
// A regression that drops envelope wrapping (e.g. the relay reverting to a
// raw byte forwarder) fails this test on the first read deadline.
func TestFullHandshakeIntegration(t *testing.T) {
	url, hub := setupShareServer(t)
	room, err := hub.CreateRoom()
	if err != nil {
		t.Fatal(err)
	}

	sharer := dialRoom(t, url, room.id)
	viewer := dialRoom(t, url, room.id)

	joined := readEnvelope(t, sharer)
	if got := envString(t, joined, "type"); got != "peer-joined" {
		t.Fatalf("expected peer-joined, got %q (full envelope: %v)", got, joined)
	}
	viewerID := envString(t, joined, "peerId")
	if viewerID == "" {
		t.Fatal("expected non-empty peerId in peer-joined")
	}

	out, err := json.Marshal(map[string]any{
		"type":    "message",
		"payload": "sdp-offer-ciphertext",
	})
	if err != nil {
		t.Fatal(err)
	}
	if err := viewer.WriteMessage(websocket.TextMessage, out); err != nil {
		t.Fatal(err)
	}

	relayed := readEnvelope(t, sharer)
	if got := envString(t, relayed, "type"); got != "message" {
		t.Fatalf("expected relayed message envelope, got %q (full envelope: %v)", got, relayed)
	}
	if got := envString(t, relayed, "from"); got != viewerID {
		t.Fatalf("relayed from mismatch: got %q want %q", got, viewerID)
	}
	if got := envString(t, relayed, "payload"); got != "sdp-offer-ciphertext" {
		t.Fatalf("payload mismatch: got %q", got)
	}

	if err := viewer.WriteMessage(websocket.CloseMessage,
		websocket.FormatCloseMessage(websocket.CloseNormalClosure, "bye")); err != nil {
		t.Fatal(err)
	}
	_ = viewer.Close()

	// Tighter deadline than readEnvelope's default — peer-left should be
	// emitted promptly once the viewer's readPump returns.
	if err := sharer.SetReadDeadline(time.Now().Add(time.Second)); err != nil {
		t.Fatal(err)
	}
	left := readEnvelope(t, sharer)
	if got := envString(t, left, "type"); got != "peer-left" {
		t.Fatalf("expected peer-left, got %q (full envelope: %v)", got, left)
	}
	if got := envString(t, left, "peerId"); got != viewerID {
		t.Fatalf("peer-left peerId mismatch: got %q want %q", got, viewerID)
	}
}
