package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/labstack/echo/v4"
)

func TestServeRSS(t *testing.T) {
	body := setupRSSFixture(t)

	e := echo.New()
	e.GET("/rss.xml", serveRSS)
	e.GET("/feed", serveRSS)
	e.GET("/feed/", serveRSS)

	for _, path := range []string{"/rss.xml", "/feed", "/feed/"} {
		t.Run(path, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, path, nil)
			rec := httptest.NewRecorder()
			e.ServeHTTP(rec, req)

			if rec.Code != http.StatusOK {
				t.Fatalf("status: want 200, got %d", rec.Code)
			}
			if got, want := rec.Header().Get(echo.HeaderContentType), "application/rss+xml; charset=utf-8"; got != want {
				t.Fatalf("Content-Type: want %q, got %q", want, got)
			}
			if rec.Body.String() != body {
				t.Fatalf("body mismatch:\n got:  %q\n want: %q", rec.Body.String(), body)
			}
		})
	}
}

// setupRSSFixture writes a fixture rss.xml under a temp dist/ directory and
// chdirs into it so serveRSS resolves the file via its relative path. Returns
// the body content for assertion.
func setupRSSFixture(t *testing.T) string {
	t.Helper()
	dir := t.TempDir()
	distDir := filepath.Join(dir, "dist")
	if err := os.Mkdir(distDir, 0o755); err != nil {
		t.Fatalf("mkdir dist: %v", err)
	}
	body := `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>t</title></channel></rss>`
	if err := os.WriteFile(filepath.Join(distDir, "rss.xml"), []byte(body), 0o644); err != nil {
		t.Fatalf("write rss.xml: %v", err)
	}
	t.Chdir(dir)
	return body
}
