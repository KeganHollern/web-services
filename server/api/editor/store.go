package editor

import "context"

// EditorStore defines the interface for persisting document state.
type EditorStore interface {
	// Load retrieves the latest state for a document.
	// Returns nil with no error if the document has no saved state.
	Load(ctx context.Context, documentID string) ([]byte, error)
	// Save persists the current state for a document.
	Save(ctx context.Context, documentID string, data []byte) error
}
