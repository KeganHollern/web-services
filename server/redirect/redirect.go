// Package redirect provides Echo middleware that 301-redirects requests for
// known service subdomains of lystic.dev to their canonical subpath form on
// the apex domain (e.g. blog.lystic.dev/foo -> lystic.dev/blog/foo).
package redirect

import (
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
)

const apexHost = "lystic.dev"

// knownSubdomains is the whitelist of service subdomains that get folded into
// canonical /<name>/ subpaths on the apex. Anything not in this set falls
// through unchanged.
var knownSubdomains = map[string]string{
	"blog":    "/blog",
	"secret":  "/secret",
	"edit":    "/edit",
	"rustpad": "/edit",
	"swap":    "/swap",
	"share":   "/share",
	"ping":    "/ping",
}

// Subdomain returns Echo middleware that issues HTTP 301 redirects from known
// lystic.dev service subdomains to the canonical apex subpath form.
//
// Skipped (passthrough): apex/www hosts, localhost, unknown subdomains, and
// any path under /api/ (so WebSocket handshakes against /api/share,
// /api/editor/ws/:id, etc. on subdomains continue to work until the API is
// migrated separately).
func Subdomain() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			req := c.Request()

			// Never redirect API traffic — WebSocket upgrades on
			// /api/share and /api/editor/ws/:id would break.
			if strings.HasPrefix(req.URL.Path, "/api/") || req.URL.Path == "/api" {
				return next(c)
			}

			// Legacy RSS path: blog.lystic.dev/feed[/] was the original
			// feed URL. Passthrough so the apex /feed handler serves the
			// same RSS content directly, instead of double-redirecting
			// through /blog/feed/.
			if req.URL.Path == "/feed" || req.URL.Path == "/feed/" {
				return next(c)
			}

			sub := matchSubdomain(req.Host)
			if sub == "" {
				return next(c)
			}

			// Hardcode https for known prod hostnames; we don't rely
			// on X-Forwarded-Proto trust config here.
			target := "https://" + apexHost + sub + req.RequestURI
			return c.Redirect(http.StatusMovedPermanently, target)
		}
	}
}

// matchSubdomain returns the canonical apex subpath (e.g. "/blog") if host is
// a known lystic.dev service subdomain, or "" otherwise.
func matchSubdomain(host string) string {
	host = strings.ToLower(host)
	if i := strings.IndexByte(host, ':'); i >= 0 {
		host = host[:i]
	}
	if host == "" {
		return ""
	}

	suffix := "." + apexHost
	if !strings.HasSuffix(host, suffix) {
		return ""
	}
	label := host[:len(host)-len(suffix)]
	// Reject multi-label subdomains like "foo.bar.lystic.dev" — only
	// single-label service subdomains are whitelisted.
	if label == "" || strings.ContainsRune(label, '.') {
		return ""
	}
	return knownSubdomains[label]
}
