package secret

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jellydator/ttlcache/v3"
)

const (
	memoryTTL         = 24 * time.Hour
	memoryMaxCapacity = 10_000
)

// MemoryStore implements SecretStore with an in-memory TTL cache.
// Secrets expire after 24 hours and do not persist across restarts.
type MemoryStore struct {
	cache *ttlcache.Cache[string, string]
}

// NewMemoryStore creates a MemoryStore backed by an in-memory TTL cache.
func NewMemoryStore() *MemoryStore {
	cache := ttlcache.New[string, string](
		ttlcache.WithTTL[string, string](memoryTTL),
		ttlcache.WithCapacity[string, string](memoryMaxCapacity),
	)
	go cache.Start()

	return &MemoryStore{cache: cache}
}

func (s *MemoryStore) Create(_ context.Context, content string) (string, error) {
	id := uuid.NewString()
	s.cache.Set(id, content, ttlcache.DefaultTTL)
	return id, nil
}

func (s *MemoryStore) GetAndDelete(_ context.Context, id string) (string, error) {
	item := s.cache.Get(id)
	if item == nil {
		return "", ErrNotFound
	}
	s.cache.Delete(id)
	return item.Value(), nil
}
