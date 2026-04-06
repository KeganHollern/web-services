package editor

import (
	"sync"
	"testing"
	"time"
)

func TestGetOrCreateRoom_CreatesNewRoom(t *testing.T) {
	store := NewMemoryStore()
	hub := NewHub(store)

	room := hub.getOrCreateRoom("doc-1")
	if room == nil {
		t.Fatal("expected room to be created")
	}
	if room.id != "doc-1" {
		t.Fatalf("expected room id 'doc-1', got %q", room.id)
	}
}

func TestGetOrCreateRoom_ReturnsSameRoom(t *testing.T) {
	store := NewMemoryStore()
	hub := NewHub(store)

	room1 := hub.getOrCreateRoom("doc-1")
	room2 := hub.getOrCreateRoom("doc-1")

	if room1 != room2 {
		t.Fatal("expected same room instance for same document ID")
	}
}

func TestGetOrCreateRoom_DifferentIDs(t *testing.T) {
	store := NewMemoryStore()
	hub := NewHub(store)

	room1 := hub.getOrCreateRoom("doc-1")
	room2 := hub.getOrCreateRoom("doc-2")

	if room1 == room2 {
		t.Fatal("expected different room instances for different document IDs")
	}
}

func TestRegister_AddsClientToRoom(t *testing.T) {
	store := NewMemoryStore()
	hub := NewHub(store)
	room := hub.getOrCreateRoom("doc-1")

	client := &Client{
		room: room,
		send: make(chan []byte, 64),
	}
	hub.register <- client

	// Give the hub event loop time to process.
	time.Sleep(50 * time.Millisecond)

	room.mu.Lock()
	_, exists := room.clients[client]
	room.mu.Unlock()

	if !exists {
		t.Fatal("expected client to be registered in room")
	}
}

func TestUnregister_RemovesClient(t *testing.T) {
	store := NewMemoryStore()
	hub := NewHub(store)
	room := hub.getOrCreateRoom("doc-1")

	client := &Client{
		room: room,
		send: make(chan []byte, 64),
	}
	hub.register <- client
	time.Sleep(50 * time.Millisecond)

	hub.unregister <- client
	time.Sleep(50 * time.Millisecond)

	room.mu.Lock()
	_, exists := room.clients[client]
	room.mu.Unlock()

	if exists {
		t.Fatal("expected client to be removed from room")
	}
}

func TestUnregister_EmptyRoomCleansUp(t *testing.T) {
	store := NewMemoryStore()
	hub := NewHub(store)
	room := hub.getOrCreateRoom("doc-cleanup")

	// Insert some text so we can verify persistence.
	room.mu.Lock()
	room.doc.ClientID = 200
	text := room.doc.GetText("content")
	text.Insert(0, "cleanup-test", nil)
	room.mu.Unlock()

	client := &Client{
		room: room,
		send: make(chan []byte, 64),
	}
	hub.register <- client
	time.Sleep(50 * time.Millisecond)

	hub.unregister <- client
	time.Sleep(100 * time.Millisecond)

	// Room should be removed from the hub. Getting the same ID should create a new room.
	newRoomInstance := hub.getOrCreateRoom("doc-cleanup")
	if newRoomInstance == room {
		t.Fatal("expected a new room after cleanup")
	}

	// The new room should have loaded persisted state.
	newRoomInstance.mu.Lock()
	result := newRoomInstance.doc.GetText("content").ToString()
	newRoomInstance.mu.Unlock()

	if result != "cleanup-test" {
		t.Fatalf("expected 'cleanup-test', got %q", result)
	}
}

func TestGetOrCreateRoom_ConcurrentSafety(t *testing.T) {
	store := NewMemoryStore()
	hub := NewHub(store)

	const goroutines = 20
	rooms := make([]*Room, goroutines)
	var wg sync.WaitGroup
	wg.Add(goroutines)

	for i := 0; i < goroutines; i++ {
		go func(idx int) {
			defer wg.Done()
			rooms[idx] = hub.getOrCreateRoom("concurrent-doc")
		}(i)
	}
	wg.Wait()

	// All goroutines should get the same room.
	for i := 1; i < goroutines; i++ {
		if rooms[i] != rooms[0] {
			t.Fatalf("goroutine %d got a different room than goroutine 0", i)
		}
	}
}
