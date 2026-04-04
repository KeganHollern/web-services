package secret

import (
	"context"
	"errors"
)

// ErrNotFound is returned when a secret does not exist.
var ErrNotFound = errors.New("secret not found")

// SecretStore defines the interface for storing and retrieving one-time secrets.
type SecretStore interface {
	// Create stores the content and returns a unique ID.
	Create(ctx context.Context, content string) (id string, err error)
	// GetAndDelete atomically retrieves and removes a secret by ID.
	// Returns ErrNotFound if the secret does not exist.
	GetAndDelete(ctx context.Context, id string) (content string, err error)
}
