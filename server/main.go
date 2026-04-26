package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"

	"github.com/KeganHollern/web-services/server/api"
	"github.com/KeganHollern/web-services/server/api/editor"
	"github.com/KeganHollern/web-services/server/api/secret"
	"github.com/KeganHollern/web-services/server/api/share"
	"github.com/KeganHollern/web-services/server/db"
	"github.com/KeganHollern/web-services/server/redirect"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	// Configure log level from environment
	level := slog.LevelInfo
	if strings.EqualFold(os.Getenv("LOG_LEVEL"), "debug") {
		level = slog.LevelDebug
	}
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: level})))

	// Initialize secret store with MongoDB, falling back to in-memory
	var secretStore secret.SecretStore
	database, err := db.Connect()
	if err != nil {
		slog.Warn("MongoDB not configured, using in-memory secret storage — secrets will not persist across restarts", "error", err)
		secretStore = secret.NewMemoryStore()
	} else {
		mongoStore, err := secret.NewMongoStore(database)
		if err != nil {
			slog.Warn("MongoDB not configured, using in-memory secret storage — secrets will not persist across restarts", "error", err)
			secretStore = secret.NewMemoryStore()
		} else {
			slog.Info("using MongoDB for secret storage")
			secretStore = mongoStore
		}
	}

	// Echo instance
	e := echo.New()

	// Global Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	// Redirect www.lystic.dev → lystic.dev (301)
	e.Pre(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			req := c.Request()
			host := req.Host
			if strings.HasPrefix(strings.ToLower(host), "www.") {
				target := "https://" + host[4:] + req.RequestURI
				return c.Redirect(http.StatusMovedPermanently, target)
			}
			return next(c)
		}
	})

	// Redirect known service subdomains (blog., secret., edit., swap.,
	// share., ping.) to their canonical /<name>/ subpath on the apex.
	// Runs before static serving and /api/* registration; /api/* paths
	// are passed through so WebSocket handshakes keep working.
	e.Pre(redirect.Subdomain())

	// NOTE: nginx also restricts body size, this is just a second layer of protection
	// to prevent large requests from hitting the server.
	e.Use(middleware.BodyLimit("100M"))

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

	// SPA fallback: HTML5 mode does not rescue requests that resolve to a
	// directory with no index.html (e.g. /blog, because public/blog/<slug>/
	// assets materialize a dist/blog/ directory). Catch those 404s here and
	// serve the SPA shell so the React router can take over.
	defaultErrorHandler := e.HTTPErrorHandler
	e.HTTPErrorHandler = func(err error, c echo.Context) {
		he, ok := err.(*echo.HTTPError)
		if ok && he.Code == http.StatusNotFound {
			req := c.Request()
			if req.Method == http.MethodGet && !strings.HasPrefix(req.URL.Path, "/api/") {
				if ferr := c.File("dist/index.html"); ferr == nil {
					return
				}
			}
		}
		defaultErrorHandler(err, c)
	}

	// Initialize editor store with MongoDB, falling back to in-memory
	var editorStore editor.EditorStore
	if database != nil {
		mongoEditorStore, err := editor.NewMongoStore(database)
		if err != nil {
			slog.Warn("failed to create MongoDB editor store, using in-memory editor storage", "error", err)
			editorStore = editor.NewMemoryStore()
		} else {
			slog.Info("using MongoDB for editor document storage")
			editorStore = mongoEditorStore
		}
	} else {
		editorStore = editor.NewMemoryStore()
	}

	// Initialize editor WebSocket hub
	editorHub := editor.NewHub(editorStore)

	// Initialize share relay hub (in-memory only; see server/api/share/README.md)
	shareHub := share.NewHub()

	// Serve APIs
	api.Register(e, secretStore, editorHub, shareHub)

	// Graceful shutdown: persist all rooms on SIGINT/SIGTERM
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	go func() {
		if err := e.Start(":80"); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("failed to start server", "error", err)
		}
	}()

	<-ctx.Done()
	slog.Info("shutting down, persisting all rooms...")
	editorHub.Shutdown()
	if err := e.Shutdown(context.Background()); err != nil {
		slog.Error("failed to shut down server", "error", err)
	}
}
