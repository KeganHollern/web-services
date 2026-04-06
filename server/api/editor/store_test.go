package editor

import (
	"context"
	"testing"
)

func TestMemoryStore_SaveLoadRoundTrip(t *testing.T) {
	store := NewMemoryStore()
	ctx := context.Background()

	data := []byte("hello world")
	if err := store.Save(ctx, "doc1", data); err != nil {
		t.Fatalf("Save failed: %v", err)
	}

	loaded, err := store.Load(ctx, "doc1")
	if err != nil {
		t.Fatalf("Load failed: %v", err)
	}
	if string(loaded) != string(data) {
		t.Fatalf("expected %q, got %q", data, loaded)
	}
}

func TestMemoryStore_LoadUnknownReturnsNil(t *testing.T) {
	store := NewMemoryStore()
	ctx := context.Background()

	loaded, err := store.Load(ctx, "nonexistent")
	if err != nil {
		t.Fatalf("Load failed: %v", err)
	}
	if loaded != nil {
		t.Fatalf("expected nil for unknown document, got %v", loaded)
	}
}

func TestMemoryStore_ReturnsCopy(t *testing.T) {
	store := NewMemoryStore()
	ctx := context.Background()

	original := []byte("immutable")
	if err := store.Save(ctx, "doc1", original); err != nil {
		t.Fatalf("Save failed: %v", err)
	}

	// Mutate the original slice after saving.
	original[0] = 'X'

	loaded, err := store.Load(ctx, "doc1")
	if err != nil {
		t.Fatalf("Load failed: %v", err)
	}
	if loaded[0] != 'i' {
		t.Fatal("store did not copy on save — mutating source affected stored data")
	}

	// Mutate the loaded slice.
	loaded[0] = 'Z'

	loaded2, err := store.Load(ctx, "doc1")
	if err != nil {
		t.Fatalf("Load failed: %v", err)
	}
	if loaded2[0] != 'i' {
		t.Fatal("store did not copy on load — mutating returned slice affected stored data")
	}
}

func TestMemoryStore_OverwriteExisting(t *testing.T) {
	store := NewMemoryStore()
	ctx := context.Background()

	if err := store.Save(ctx, "doc1", []byte("v1")); err != nil {
		t.Fatalf("Save failed: %v", err)
	}
	if err := store.Save(ctx, "doc1", []byte("v2")); err != nil {
		t.Fatalf("Save failed: %v", err)
	}

	loaded, err := store.Load(ctx, "doc1")
	if err != nil {
		t.Fatalf("Load failed: %v", err)
	}
	if string(loaded) != "v2" {
		t.Fatalf("expected v2, got %q", loaded)
	}
}
