package secret

import (
	"log/slog"
	"net/http"

	"github.com/labstack/echo/v4"
)

type RequestBody struct {
	Content string `json:"content"`
}

func Register(api *echo.Group) {
	secret := api.Group("/secret")
	secret.GET("/:id", func(c echo.Context) error {
		slog.Info("request to fetch secret", slog.String("id", c.Param("id")))
		return c.String(http.StatusOK, "U2FsdGVkX1/waYONbqZS2iQqrtAfGm4kmVzonfobM6c=")
	})

	secret.POST("/create", func(c echo.Context) error {
		var body RequestBody
		if err := c.Bind(&body); err != nil {
			return c.String(http.StatusBadRequest, "bad request")
		}

		slog.Info("request to store secret", slog.String("content", body.Content))

		// TODO: store secret
		// TODO: generate unique id for this secret
		return c.String(http.StatusOK, "ToDoUnIqUeIdHeRe")
	})
}
