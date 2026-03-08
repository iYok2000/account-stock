package handler

import (
	"net/http"

	"account-stock-be/internal/database"
	"account-stock-be/internal/middleware"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// DeleteSelf handles DELETE /api/users/me (soft delete).
// If user is SuperAdmin and has shop_id, soft-deletes shop + users in that shop + import_sku_row.
func DeleteSelf(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		middleware.WriteJSONError(w, middleware.ErrMethodNotAllowed, http.StatusMethodNotAllowed)
		return
	}
	ctx := middleware.GetContext(r.Context())
	if ctx == nil || ctx.UserID == "" {
		middleware.WriteJSONError(w, middleware.ErrUnauthorized, http.StatusUnauthorized)
		return
	}
	db := database.DB()
	if db == nil {
		middleware.WriteJSONError(w, middleware.ErrInternal, http.StatusInternalServerError)
		return
	}

	if err := db.Transaction(func(tx *gorm.DB) error {
		if ctx.Role == "SuperAdmin" && ctx.ShopID != "" {
			if err := softDelete(tx, "shops", "id = ?", ctx.ShopID); err != nil {
				return err
			}
			if err := softDelete(tx, "users", "shop_id = ?", ctx.ShopID); err != nil {
				return err
			}
			_ = softDelete(tx, "import_sku_row", "shop_id = ?", ctx.ShopID)
		}
		if err := softDelete(tx, "users", "id = ?", ctx.UserID); err != nil {
			return err
		}
		return nil
	}); err != nil {
		middleware.WriteJSONError(w, middleware.ErrInternal, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func softDelete(tx *gorm.DB, table string, query string, args ...interface{}) error {
	return tx.Table(table).Clauses(clause.Returning{}).Where(query, args...).Update("deleted_at", gorm.Expr("now()")).Error
}
