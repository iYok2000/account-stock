package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"account-stock-be/internal/database"
	"account-stock-be/internal/middleware"
)

// ImportOrderTransactionResponse stub response until import is persisted.
type ImportOrderTransactionResponse struct {
	OK       bool   `json:"ok"`
	ImportID int64  `json:"import_id,omitempty"`
	SavedAt  string `json:"saved_at,omitempty"`
}

type importResultRow struct {
	ID        int64       `json:"id" gorm:"primaryKey;autoIncrement;column:id"`
	CompanyID string      `json:"company_id"`
	Summary   interface{} `json:"summary" gorm:"type:jsonb"`
	Daily     interface{} `json:"daily" gorm:"type:jsonb"`
	Items     interface{} `json:"items" gorm:"type:jsonb"`
	CreatedAt time.Time   `json:"created_at" gorm:"column:created_at;autoCreateTime"`
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
	db := database.DB()
	ctx := middleware.GetContext(r.Context())
	now := time.Now().UTC()
	if db != nil && ctx != nil && ctx.CompanyID != "" {
		row := importResultRow{
			CompanyID: ctx.CompanyID,
			Summary:   body.Summary,
			Daily:     body.Daily,
			Items:     body.Items,
			CreatedAt: now,
		}
		if err := db.Table("import_results").Create(&row).Error; err == nil {
			writeOK(w, row.ID, now)
			return
		}
	}
	writeOK(w, 0, now)
}

func writeOK(w http.ResponseWriter, id int64, t time.Time) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(ImportOrderTransactionResponse{
		OK:       true,
		ImportID: id,
		SavedAt:  t.Format(time.RFC3339),
	})
}
