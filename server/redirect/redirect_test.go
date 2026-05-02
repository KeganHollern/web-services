package redirect

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
)

// newTestEcho wires the Subdomain middleware as a Pre-router middleware (the
// same way main.go does) and installs a catch-all handler that returns 200
// "passthrough" so we can distinguish "redirected" from "fell through".
func newTestEcho() *echo.Echo {
	e := echo.New()
	e.Pre(Subdomain())
	e.Any("/*", func(c echo.Context) error {
		return c.String(http.StatusOK, "passthrough")
	})
	return e
}

func do(t *testing.T, host, target string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, target, nil)
	req.Host = host
	rec := httptest.NewRecorder()
	newTestEcho().ServeHTTP(rec, req)
	return rec
}

func TestKnownSubdomainsRedirect(t *testing.T) {
	cases := []struct {
		host string
		path string
		want string
	}{
		{"blog.lystic.dev", "/foo", "https://lystic.dev/blog/foo"},
		{"secret.lystic.dev", "/abc123", "https://lystic.dev/secret/abc123"},
		{"edit.lystic.dev", "/doc/42", "https://lystic.dev/edit/doc/42"},
		{"rustpad.lystic.dev", "/doc/42", "https://lystic.dev/edit/doc/42"},
		{"rustpad.lystic.dev", "/", "https://lystic.dev/edit/"},
		{"swap.lystic.dev", "/", "https://lystic.dev/swap/"},
		{"share.lystic.dev", "/room", "https://lystic.dev/share/room"},
		{"ping.lystic.dev", "/", "https://lystic.dev/ping/"},
	}

	for _, tc := range cases {
		t.Run(tc.host+tc.path, func(t *testing.T) {
			rec := do(t, tc.host, tc.path)
			if rec.Code != http.StatusMovedPermanently {
				t.Fatalf("status: got %d, want 301", rec.Code)
			}
			if got := rec.Header().Get("Location"); got != tc.want {
				t.Fatalf("Location: got %q, want %q", got, tc.want)
			}
		})
	}
}

func TestQueryStringPreserved(t *testing.T) {
	rec := do(t, "blog.lystic.dev", "/foo?bar=1&baz=qux%20space")
	if rec.Code != http.StatusMovedPermanently {
		t.Fatalf("status: got %d, want 301", rec.Code)
	}
	want := "https://lystic.dev/blog/foo?bar=1&baz=qux%20space"
	if got := rec.Header().Get("Location"); got != want {
		t.Fatalf("Location: got %q, want %q", got, want)
	}
}

func TestEncodedPathPreserved(t *testing.T) {
	// %20 in the path should not be decoded into a literal space.
	rec := do(t, "blog.lystic.dev", "/posts/hello%20world")
	want := "https://lystic.dev/blog/posts/hello%20world"
	if got := rec.Header().Get("Location"); got != want {
		t.Fatalf("Location: got %q, want %q", got, want)
	}
}

func TestApexPassthrough(t *testing.T) {
	for _, host := range []string{"lystic.dev", "lystic.dev:443"} {
		t.Run(host, func(t *testing.T) {
			rec := do(t, host, "/blog/foo")
			if rec.Code != http.StatusOK {
				t.Fatalf("status: got %d, want 200 (got Location=%q)",
					rec.Code, rec.Header().Get("Location"))
			}
		})
	}
}

func TestLocalhostPassthrough(t *testing.T) {
	for _, host := range []string{"localhost", "localhost:80", "127.0.0.1"} {
		t.Run(host, func(t *testing.T) {
			rec := do(t, host, "/blog/foo")
			if rec.Code != http.StatusOK {
				t.Fatalf("status: got %d, want 200", rec.Code)
			}
		})
	}
}

func TestUnknownSubdomainPassthrough(t *testing.T) {
	for _, host := range []string{"foo.lystic.dev", "api.lystic.dev", "deep.blog.lystic.dev"} {
		t.Run(host, func(t *testing.T) {
			rec := do(t, host, "/foo")
			if rec.Code != http.StatusOK {
				t.Fatalf("status: got %d, want 200 (got Location=%q)",
					rec.Code, rec.Header().Get("Location"))
			}
		})
	}
}

func TestForeignHostPassthrough(t *testing.T) {
	rec := do(t, "evil.example.com", "/blog")
	if rec.Code != http.StatusOK {
		t.Fatalf("status: got %d, want 200", rec.Code)
	}
}

func TestAPIPathPassthroughOnSubdomain(t *testing.T) {
	// /api/* on a known subdomain must NOT redirect — WebSocket upgrades
	// against /api/share and /api/editor/ws/:id rely on this.
	cases := []string{
		"/api/share",
		"/api/share/room/abc",
		"/api/editor/ws/abc-123",
		"/api/secret/foo",
	}
	for _, p := range cases {
		t.Run(p, func(t *testing.T) {
			rec := do(t, "share.lystic.dev", p)
			if rec.Code != http.StatusOK {
				t.Fatalf("status: got %d, want 200 (got Location=%q)",
					rec.Code, rec.Header().Get("Location"))
			}
		})
	}
}

func TestHostWithPortRedirects(t *testing.T) {
	rec := do(t, "blog.lystic.dev:8080", "/foo")
	if rec.Code != http.StatusMovedPermanently {
		t.Fatalf("status: got %d, want 301", rec.Code)
	}
	want := "https://lystic.dev/blog/foo"
	if got := rec.Header().Get("Location"); got != want {
		t.Fatalf("Location: got %q, want %q", got, want)
	}
}

func TestHostCaseInsensitive(t *testing.T) {
	rec := do(t, "BLOG.Lystic.Dev", "/foo")
	if rec.Code != http.StatusMovedPermanently {
		t.Fatalf("status: got %d, want 301", rec.Code)
	}
	want := "https://lystic.dev/blog/foo"
	if got := rec.Header().Get("Location"); got != want {
		t.Fatalf("Location: got %q, want %q", got, want)
	}
}

func TestLegacyFeedPathPassthroughOnSubdomain(t *testing.T) {
	// Legacy blog.lystic.dev/feed[/] must pass through so the apex /feed
	// handler can serve RSS directly, instead of redirecting to
	// /blog/feed/ where no handler exists.
	for _, p := range []string{"/feed", "/feed/"} {
		t.Run(p, func(t *testing.T) {
			rec := do(t, "blog.lystic.dev", p)
			if rec.Code != http.StatusOK {
				t.Fatalf("status: got %d, want 200 (got Location=%q)",
					rec.Code, rec.Header().Get("Location"))
			}
		})
	}
}

func TestApiExactPathOnSubdomainPassthrough(t *testing.T) {
	// "/api" exactly (no trailing slash) on a subdomain should also
	// passthrough to avoid breaking any handler registered at that path.
	rec := do(t, "share.lystic.dev", "/api")
	if rec.Code != http.StatusOK {
		t.Fatalf("status: got %d, want 200 (got Location=%q)",
			rec.Code, rec.Header().Get("Location"))
	}
}
