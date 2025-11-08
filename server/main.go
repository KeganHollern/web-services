package main

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/KeganHollern/web-services/server/api"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	// Echo instance
	e := echo.New()

	// Global Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
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
	api.Register(e)

	// Start server
	if err := e.Start(":80"); err != nil && !errors.Is(err, http.ErrServerClosed) {
		slog.Error("failed to start server", "error", err)
	}
}
