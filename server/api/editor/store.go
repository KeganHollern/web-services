package editor

import "context"

// EditorStore persists document state as opaque byte slices.
// Implementations should expire documents 24 hours after the last Save call.
type EditorStore interface {
	// Load retrieves the latest state for a document.
	// Returns nil with no error if the document has no saved state.
	Load(ctx context.Context, documentID string) ([]byte, error)
	// Save persists the current state for a document.
	// Each call resets the document's TTL to 24 hours from now.
	Save(ctx context.Context, documentID string, data []byte) error
}
