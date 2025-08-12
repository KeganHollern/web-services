package secret

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/jellydator/ttlcache/v3"
	"github.com/labstack/echo/v4"
)

const (
	cache_lifetime = time.Hour * 24 * 7 // 1 week
	cache_capacity = 10000              // 10k items
)

type RequestBody struct {
	Content string `json:"content"`
}

func Register(api *echo.Group) {
	cache := ttlcache.New(
		ttlcache.WithTTL[string, string](cache_lifetime),
		ttlcache.WithCapacity[string, string](cache_capacity),
	)

	secret := api.Group("/secret")
	secret.GET("/:id", func(c echo.Context) error {
		slog.Info("request to fetch secret", slog.String("id", c.Param("id")))

		item, ok := cache.GetAndDelete(c.Param("id"))
		if !ok {
			return echo.ErrNotFound
		}

		return c.String(http.StatusOK, item.Value())
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

		id := uuid.NewString()
		cache.Set(id, body.Content, ttlcache.DefaultTTL)

		return c.String(http.StatusOK, id)
	})
}
