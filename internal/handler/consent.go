package handler

import (
	"net/http"
	"os"
	"time"

	"account-stock-be/internal/middleware"
)

// Cookie-based PDPA/Legal acknowledgement for tax/calculator pages.
// No persistence needed; one-time per device/browser.

const pdpaCookieName = "pdpa_tax_ack_v2"
const pdpaCookieMaxAgeSeconds = 365 * 24 * 60 * 60 // 1 year

// GetPDPAConsent handles GET /api/consent/pdpa — returns whether the cookie is present.
func GetPDPAConsent(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		middleware.WriteJSONError(w, middleware.ErrMethodNotAllowed, http.StatusMethodNotAllowed)
		return
	}
	accepted := hasConsentCookie(r)
	writeJSON(w, http.StatusOK, map[string]bool{"accepted": accepted})
}

// PostPDPAConsent handles POST /api/consent/pdpa — sets the consent cookie.
func PostPDPAConsent(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		middleware.WriteJSONError(w, middleware.ErrMethodNotAllowed, http.StatusMethodNotAllowed)
		return
	}

	cookie := &http.Cookie{
		Name:     pdpaCookieName,
		Value:    "1",
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   pdpaCookieMaxAgeSeconds,
	}
	if os.Getenv("APP_ENV") == "production" {
		cookie.Secure = true
	}
	http.SetCookie(w, cookie)

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"ok":       true,
		"accepted": true,
		"expires":  time.Now().Add(time.Duration(pdpaCookieMaxAgeSeconds) * time.Second).Format(time.RFC3339),
	})
}

func hasConsentCookie(r *http.Request) bool {
	c, err := r.Cookie(pdpaCookieName)
	return err == nil && c.Value == "1"
}
