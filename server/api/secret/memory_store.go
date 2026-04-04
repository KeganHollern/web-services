package secret

import (
	"sync"

	"github.com/google/uuid"
)

// MemorySecretStore implements SecretStore with an in-memory map.
// Secrets do not persist across restarts.
type MemorySecretStore struct {
	mu      sync.Mutex
	secrets map[string]string
}

// NewMemorySecretStore creates an empty in-memory secret store.
func NewMemorySecretStore() *MemorySecretStore {
	return &MemorySecretStore{
		secrets: make(map[string]string),
	}
}

func (s *MemorySecretStore) Create(content string) (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	id := uuid.NewString()
	s.secrets[id] = content
	return id, nil
}

func (s *MemorySecretStore) GetAndDelete(id string) (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	content, ok := s.secrets[id]
	if !ok {
		return "", ErrNotFound
	}
	delete(s.secrets, id)
	return content, nil
}
