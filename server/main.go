package main

import (
	"errors"
	"log/slog"
	"net/http"
	"os"

	"github.com/KeganHollern/web-services/server/api"
	"github.com/KeganHollern/web-services/server/api/editor"
	"github.com/KeganHollern/web-services/server/api/secret"
	"github.com/KeganHollern/web-services/server/db"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	// Configure log level from environment
	level := slog.LevelInfo
	if os.Getenv("LOG_LEVEL") == "debug" {
		level = slog.LevelDebug
	}
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: level})))

	// Initialize secret store with MongoDB, falling back to in-memory
	var secretStore secret.SecretStore
	database, err := db.Connect()
	if err != nil {
		slog.Warn("MongoDB not configured, using in-memory secret storage — secrets will not persist across restarts", "error", err)
		secretStore = secret.NewMemoryStore()
	} else {
		mongoStore, err := secret.NewMongoStore(database)
		if err != nil {
			slog.Warn("MongoDB not configured, using in-memory secret storage — secrets will not persist across restarts", "error", err)
			secretStore = secret.NewMemoryStore()
		} else {
			slog.Info("using MongoDB for secret storage")
			secretStore = mongoStore
		}
	}

	// Echo instance
	e := echo.New()

	// Global Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	// NOTE: nginx also restricts body size, this is just a second layer of protection
	// to prevent large requests from hitting the server.
	e.Use(middleware.BodyLimit("100M"))

	// Serve react SPA
	e.Use(middleware.StaticWithConfig(middleware.StaticConfig{
		Skipper:    nil,
		Root:       "dist",
		Index:      "index.html",
		HTML5:      true, // send not-found files to SPA (react) to handle routing
		Browse:     false,
		IgnoreBase: false,
		Filesystem: nil,
	}))

	// Initialize editor store with MongoDB, falling back to in-memory
	var editorStore editor.EditorStore
	if database != nil {
		mongoEditorStore, err := editor.NewMongoStore(database)
		if err != nil {
			slog.Warn("failed to create MongoDB editor store, using in-memory editor storage", "error", err)
			editorStore = editor.NewMemoryStore()
		} else {
			slog.Info("using MongoDB for editor document storage")
			editorStore = mongoEditorStore
		}
	} else {
		editorStore = editor.NewMemoryStore()
	}

	// Initialize editor WebSocket hub
	editorHub := editor.NewHub(editorStore)

	// Serve APIs
	api.Register(e, secretStore, editorHub)

	// Start server
	if err := e.Start(":80"); err != nil && !errors.Is(err, http.ErrServerClosed) {
		slog.Error("failed to start server", "error", err)
		return
	}
}
