package upload

import (
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/labstack/echo/v4"
)

const (
	dataPath = "/data"
)

type uploader struct {
	password string
	// TODO: upload to S3 instead of local disk
}

func Register(api *echo.Group) {
	uploadGroup := api.Group("/upload")

	uploadGroup.PUT("/", uploader{
		password: os.Getenv("upload_password"),
	}.uploadHandler)
}

func (u uploader) uploadHandler(c echo.Context) error {
	if u.password == "" {
		// if no password, upload is disabled
		return echo.NewHTTPError(http.StatusUnauthorized, "Invalid secret password")
	}

	password := c.Request().Header.Get("X-Secret-Password")
	if password != u.password {
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

	// ensure filename is safe to use
	cleanedFilename := filepath.Base(file.Filename)
	cleanedFilename = filepath.Clean(cleanedFilename)

	// create destination subpath
	// as YYYY-MM-DD/HH-MM-SS/
	subPath := filepath.Join(dataPath, time.Now().Format("2006-01-02/15-04-05"))
	if err := os.MkdirAll(subPath, 0755); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	dstPath := filepath.Join(subPath, cleanedFilename)
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
