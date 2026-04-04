package main

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/KeganHollern/web-services/server/api"
	"github.com/KeganHollern/web-services/server/api/secret"
	"github.com/KeganHollern/web-services/server/db"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	// Connect to MongoDB
	database, err := db.Connect()
	if err != nil {
		slog.Error("failed to connect to MongoDB", "error", err)
		return
	}

	// Initialize secret store
	secretStore, err := secret.NewMongoStore(database)
	if err != nil {
		slog.Error("failed to initialize secret store", "error", err)
		return
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

	// Serve APIs
	api.Register(e, secretStore)

	// Start server
	if err := e.Start(":80"); err != nil && !errors.Is(err, http.ErrServerClosed) {
		slog.Error("failed to start server", "error", err)
	}
}
