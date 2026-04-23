package share

import (
	"crypto/hmac"
	"crypto/sha1"
	"encoding/base64"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
)

// TURN credential delivery for the P2P share relay fallback.
//
// Two modes, selected via environment:
//
//  1. TURN_SECRET set — short-lived credentials minted per request using the
//     coturn REST API convention (draft-uberti-behave-turn-rest-00):
//     username   = "<unix-expiry>:<name>"
//     credential = base64(HMAC-SHA1(secret, username))
//     The TURN server must be configured with the same shared secret
//     (e.g. coturn: --use-auth-secret --static-auth-secret=<secret>).
//     This is the recommended mode — no credential is valid for more than
//     TURN_TTL_SECONDS (default 3600), so leaked creds expire quickly.
//
//  2. TURN_USERNAME + TURN_PASSWORD set — static long-lived credentials
//     returned verbatim. Simpler to operate but any leak is valid until the
//     operator rotates the password on the TURN server. Only use if the
//     TURN server's quota/ACLs mitigate the blast radius.
//
// The endpoint returns 503 when no TURN config is present so the client can
// keep the default STUN-only path and surface a clear error to the user.
//
// The returned iceServers always include configured STUN URLs first so the
// client does not lose direct-P2P candidates when it switches to the relay
// config.

type iceServer struct {
	URLs       []string `json:"urls"`
	Username   string   `json:"username,omitempty"`
	Credential string   `json:"credential,omitempty"`
}

type turnResponse struct {
	IceServers []iceServer `json:"iceServers"`
	TTLSeconds int         `json:"ttlSeconds"`
}

const (
	defaultTurnTTL = 3600
	turnCredName   = "lystic-share"
)

func defaultStunURLs() []string {
	if v := strings.TrimSpace(os.Getenv("STUN_URLS")); v != "" {
		return splitCSV(v)
	}
	return []string{"stun:stun.l.google.com:19302"}
}

func turnURLs() []string {
	v := strings.TrimSpace(os.Getenv("TURN_URLS"))
	if v == "" {
		return nil
	}
	return splitCSV(v)
}

func turnTTL() int {
	if v := strings.TrimSpace(os.Getenv("TURN_TTL_SECONDS")); v != "" {
		n, err := strconv.Atoi(v)
		if err == nil && n > 0 {
			return n
		}
	}
	return defaultTurnTTL
}

func splitCSV(v string) []string {
	parts := strings.Split(v, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}

// mintTurnRESTCredential produces (username, credential) following
// draft-uberti-behave-turn-rest-00, compatible with coturn
// --use-auth-secret mode.
func mintTurnRESTCredential(secret string, ttlSeconds int) (string, string) {
	expiry := time.Now().Add(time.Duration(ttlSeconds) * time.Second).Unix()
	username := fmt.Sprintf("%d:%s", expiry, turnCredName)
	mac := hmac.New(sha1.New, []byte(secret))
	mac.Write([]byte(username))
	credential := base64.StdEncoding.EncodeToString(mac.Sum(nil))
	return username, credential
}

// registerTurn mounts GET /turn on the provided share group.
func registerTurn(g *echo.Group) {
	g.GET("/turn", func(c echo.Context) error {
		urls := turnURLs()
		if len(urls) == 0 {
			return echo.NewHTTPError(http.StatusServiceUnavailable, "relay not configured")
		}

		stun := defaultStunURLs()
		servers := make([]iceServer, 0, 2)
		if len(stun) > 0 {
			servers = append(servers, iceServer{URLs: stun})
		}

		ttl := turnTTL()
		if secret := strings.TrimSpace(os.Getenv("TURN_SECRET")); secret != "" {
			user, cred := mintTurnRESTCredential(secret, ttl)
			servers = append(servers, iceServer{URLs: urls, Username: user, Credential: cred})
		} else {
			user := strings.TrimSpace(os.Getenv("TURN_USERNAME"))
			pass := strings.TrimSpace(os.Getenv("TURN_PASSWORD"))
			if user == "" || pass == "" {
				return echo.NewHTTPError(http.StatusServiceUnavailable, "relay credentials not configured")
			}
			servers = append(servers, iceServer{URLs: urls, Username: user, Credential: pass})
			ttl = 0
		}

		return c.JSON(http.StatusOK, turnResponse{IceServers: servers, TTLSeconds: ttl})
	})
}
