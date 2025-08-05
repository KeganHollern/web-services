package api

import (
	"github.com/KeganHollern/web-services/server/api/secret"
	"github.com/labstack/echo/v4"
)

func Register(e *echo.Echo) {
	api := e.Group("/api")
	api.Any("*", func(c echo.Context) error { return echo.ErrNotImplemented }) // any unimplemented api request

	// register /api/secret
	secret.Register(api)
}
