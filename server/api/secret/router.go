package secret

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/labstack/echo/v4"
)

type RequestBody struct {
	Content string `json:"content"`
}

func Register(api *echo.Group, store SecretStore) {
	secret := api.Group("/secret")

	secret.GET("/:id", func(c echo.Context) error {
		slog.Info("request to fetch secret", slog.String("id", c.Param("id")))

		content, err := store.GetAndDelete(c.Param("id"))
		if err != nil {
			if errors.Is(err, ErrNotFound) {
				return echo.ErrNotFound
			}
			slog.Error("failed to get secret", "error", err)
			return echo.ErrInternalServerError
		}

		return c.String(http.StatusOK, content)
	})

	secret.POST("/create", func(c echo.Context) error {
		var body RequestBody
		if err := c.Bind(&body); err != nil {
			return echo.ErrBadRequest
		}

		if len(body.Content) == 0 {
			return echo.ErrBadRequest
		}

		slog.Info("request to store secret", slog.String("content", body.Content))

		id, err := store.Create(body.Content)
		if err != nil {
			slog.Error("failed to create secret", "error", err)
			return echo.ErrInternalServerError
		}

		return c.String(http.StatusOK, id)
	})
}
