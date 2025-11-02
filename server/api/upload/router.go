package upload

import (
	"io"
	"net/http"
	"os"
	"path/filepath"

	"github.com/labstack/echo/v4"
)

const (
	dataPath       = "/data"
	secretPassword = "kegan123"
)

func Register(api *echo.Group) {
	uploadGroup := api.Group("/upload")

	uploadGroup.PUT("/", uploadHandler)
}

func uploadHandler(c echo.Context) error {
	password := c.Request().Header.Get("X-Secret-Password")
	if password != secretPassword {
		return echo.NewHTTPError(http.StatusUnauthorized, "Invalid secret password")
	}

	file, err := c.FormFile("file")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "No file provided")
	}

	src, err := file.Open()
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	defer src.Close()

	if err := os.MkdirAll(dataPath, 0755); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	dstPath := filepath.Join(dataPath, file.Filename)
	dst, err := os.Create(dstPath)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message": "File uploaded successfully",
		"path":    dstPath,
	})
}
