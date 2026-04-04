package editor

import (
	"context"
	"time"

	"github.com/jellydator/ttlcache/v3"
)

const (
	memoryTTL         = 24 * time.Hour
	memoryMaxCapacity = 10_000
)

// MemoryStore implements EditorStore with an in-memory TTL cache.
// Document state expires after 24 hours and does not persist across restarts.
type MemoryStore struct {
	cache *ttlcache.Cache[string, []byte]
}

// NewMemoryStore creates a MemoryStore backed by an in-memory TTL cache.
func NewMemoryStore() *MemoryStore {
	cache := ttlcache.New[string, []byte](
		ttlcache.WithTTL[string, []byte](memoryTTL),
		ttlcache.WithCapacity[string, []byte](memoryMaxCapacity),
	)
	go cache.Start()

	return &MemoryStore{cache: cache}
}

func (s *MemoryStore) Load(_ context.Context, documentID string) ([]byte, error) {
	item := s.cache.Get(documentID)
	if item == nil {
		return nil, nil
	}
	src := item.Value()
	cp := make([]byte, len(src))
	copy(cp, src)
	return cp, nil
}

func (s *MemoryStore) Save(_ context.Context, documentID string, data []byte) error {
	cp := make([]byte, len(data))
	copy(cp, data)
	s.cache.Set(documentID, cp, ttlcache.DefaultTTL)
	return nil
}
