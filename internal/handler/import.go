package handler

import (
	"encoding/json"
	"net/http"

	"account-stock-be/internal/middleware"
)

// ImportOrderTransactionResponse stub response until import is persisted.
type ImportOrderTransactionResponse struct {
	OK bool `json:"ok"`
}

// ImportOrderTransaction handles POST /api/import/order-transaction.
// Requires Auth + orders:create (see docs/feature/03-import.md).
// Accepts JSON body (tier, summary, daily or items); returns 200 with {"ok": true}.
// Persistence can be added later; when persisting use company_id from auth context only.
func ImportOrderTransaction(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		middleware.WriteJSONError(w, middleware.ErrMethodNotAllowed, http.StatusMethodNotAllowed)
		return
	}
	// Decode to validate; ignore body for now (stub)
	var body struct {
		Tier    string        `json:"tier"`
		Summary interface{}   `json:"summary"`
		Daily   interface{}   `json:"daily,omitempty"`
		Items   interface{}   `json:"items,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		middleware.WriteJSONError(w, middleware.ErrInvalidJSON, http.StatusBadRequest)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(ImportOrderTransactionResponse{OK: true})
}
