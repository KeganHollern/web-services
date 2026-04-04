package editor

import (
	"context"
	"sync"
)

// MemoryStore implements EditorStore with an in-memory map.
// Document state does not persist across restarts.
type MemoryStore struct {
	mu   sync.RWMutex
	docs map[string][]byte
}

// NewMemoryStore creates a MemoryStore backed by an in-memory map.
func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		docs: make(map[string][]byte),
	}
}

func (s *MemoryStore) Load(_ context.Context, documentID string) ([]byte, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	data, ok := s.docs[documentID]
	if !ok {
		return nil, nil
	}
	cp := make([]byte, len(data))
	copy(cp, data)
	return cp, nil
}

func (s *MemoryStore) Save(_ context.Context, documentID string, data []byte) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	cp := make([]byte, len(data))
	copy(cp, data)
	s.docs[documentID] = cp
	return nil
}
