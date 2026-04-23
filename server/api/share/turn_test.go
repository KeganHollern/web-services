package share

import (
	"crypto/hmac"
	"crypto/sha1"
	"encoding/base64"
	"strconv"
	"strings"
	"testing"
	"time"
)

func TestMintTurnRESTCredential(t *testing.T) {
	secret := "super-secret"
	before := time.Now().Unix()
	user, cred := mintTurnRESTCredential(secret, 600)
	after := time.Now().Unix()

	parts := strings.SplitN(user, ":", 2)
	if len(parts) != 2 {
		t.Fatalf("expected username of form <expiry>:<name>, got %q", user)
	}
	if parts[1] != turnCredName {
		t.Fatalf("expected name %q in username, got %q", turnCredName, parts[1])
	}
	expiry, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil {
		t.Fatalf("expiry not a unix timestamp: %v", err)
	}
	if expiry < before+600 || expiry > after+600 {
		t.Fatalf("expiry %d not within [%d, %d]", expiry, before+600, after+600)
	}

	mac := hmac.New(sha1.New, []byte(secret))
	mac.Write([]byte(user))
	want := base64.StdEncoding.EncodeToString(mac.Sum(nil))
	if cred != want {
		t.Fatalf("credential mismatch: got %q want %q", cred, want)
	}
}
