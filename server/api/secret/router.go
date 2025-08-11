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
		return c.String(http.StatusOK, "U2FsdGVkX19w2uxuCHy22sWNRrEyMi3SCt5MFquBYpliwczQpQSQm/rsAGW2ScM5o5qsgZJRZwAnF2SU3D6/T71oxRoifE28s5ZJVhWyZYSpffpugy4hLqsbLjq7TB2Vlic8CzqFNLoq22y2+aFNK2AW2wVp/4tJgf41tVowNblofcXcKpQa1vUxi2kGhaT5SbMMpylPMOPDBr/UZLUJf400+RaWM32Vd8T0OSrnzt8aQC2MgQi42ERFc/oEbAfj48HSn1npa4xVfT7KfaWXFoej3C5EdpMt9aahsb4Ezqr0sbAXsaiWMaAC2yKyNrSPCQSMHGO42U2EkailHrQ7MuMqCKx+X8zWZbTV3xnLwAjy6BS9nFDr7mk7ZeyOt2bxgJKyzGfkuoQwuJIuN3RJj1K5JgOK6XLLukLKrlOwLpHLqmMI893ERpDoOMZQRqVlaS1fyO1NxRUaZ6XoBB3MB1TOB7sumk3nvRMKt7KQKjXL4UsNhCAmn0M/vTdmdO7TQ2qydIFRr/fx5Wr7Lq9BuMbHpF2MblB86rANDjVjLSm3YIpzqj04piwtk6rUF7//cvuEyasRoW1ltmaP0ohGawrM8WeDyf1SGeyMW3q3BaCCN2AUliocr6cQ+7Fwo8aitpk8xnyrD9b3fXBIAOJgmxAAVagsmSkhbkTYo5M/Zhc7+tGKOL/d5j0ysSGhBPqA")
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
