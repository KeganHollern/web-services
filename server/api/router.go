package api

import (
	"github.com/KeganHollern/web-services/server/api/editor"
	"github.com/KeganHollern/web-services/server/api/secret"
	"github.com/KeganHollern/web-services/server/api/share"
	"github.com/KeganHollern/web-services/server/api/upload"
	"github.com/labstack/echo/v4"
)

func Register(e *echo.Echo, secretStore secret.SecretStore, editorHub *editor.Hub, shareHub *share.Hub) {
	api := e.Group("/api", catch)
	api.Any("*", func(c echo.Context) error { return echo.ErrNotImplemented }) // any unimplemented api request

	// TODO: rate limiter middleware on API requests

	// register /api/secret
	secret.Register(api, secretStore)
	upload.Register(api)

	// register /api/editor/ws/:id (websocket)
	editor.Register(api, editorHub)

	// register /api/share/room and /api/share/room/:id (websocket)
	share.Register(api, shareHub)
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
