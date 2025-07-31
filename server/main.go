package main

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	// Echo instance
	e := echo.New()

	// Global Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

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

	// create a base /api route which all api requests will land in
	api := e.Group("/api")
	api.Any("*", func(c echo.Context) error { return echo.ErrNotImplemented }) // any unimplemented api request

	// create /api/secret route for all secret.lystic.dev api requests
	secret := api.Group("/secret")
	secret.GET("/:id", func(c echo.Context) error {
		return c.String(http.StatusOK, "TODO fetch an actual secret")
	})
	secret.POST("/:id", func(c echo.Context) error {
		var data struct {
			Data string `json:"data"`
		}

		if err := c.Bind(&data); err != nil {
			return c.String(http.StatusBadRequest, "bad request")
		}

		// TODO: store secret

		// TODO: generate unique id for this secret
		return c.String(http.StatusOK, "ToDoUnIqUeIdHeRe")
	})

	// TODO: editor APIs

	// Start server
	if err := e.Start(":80"); err != nil && !errors.Is(err, http.ErrServerClosed) {
		slog.Error("failed to start server", "error", err)
	}
}
