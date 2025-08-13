package api

import (
	"github.com/KeganHollern/web-services/server/api/secret"
	"github.com/labstack/echo/v4"
)

func Register(e *echo.Echo) {
	api := e.Group("/api", catch)
	api.Any("*", func(c echo.Context) error { return echo.ErrNotImplemented }) // any unimplemented api request

	// register /api/secret
	secret.Register(api)
}

// Echo Middleware.
//
// catches errors like ErrNotFound and prevents them from being handled by the SPA middleware
// forces all errors in API calls to return as proper HTTP error codes with message body in JSON.
func catch(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		err := next(c)
		if err != nil {
			c.Echo().DefaultHTTPErrorHandler(err, c)
		}

		return nil
	}
}
