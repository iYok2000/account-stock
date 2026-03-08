package main

import (
	"log"
	"net/http"
	"os"

	"account-stock-be/internal/auth"
	"account-stock-be/internal/database"
	"account-stock-be/internal/handler"
	"account-stock-be/internal/middleware"
	"account-stock-be/internal/rbac"
)

func main() {
	// Production: refuse to start with dev JWT secret
	if os.Getenv("APP_ENV") == "production" {
		secret := os.Getenv("JWT_SECRET")
		if secret == "" || secret == "dev-secret-change-in-production" {
			log.Fatal("production requires JWT_SECRET to be set and not the dev default")
		}
	}
	jwtCfg := auth.DefaultJWTConfig()

	// Connect to DB (DefaultConfig has fallback for local dev)
	dbCfg := database.DefaultConfig()
	if _, err := database.Open(dbCfg); err != nil {
		log.Fatalf("database: %v", err)
	}
	defer database.Close()

	mux := http.NewServeMux()

	// Public (no auth)
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok"}`))
	})

	// API: auth — POST /api/auth/login (no JWT); GET /api/auth/me (JWT required)
	mux.HandleFunc("/api/auth/login", func(w http.ResponseWriter, r *http.Request) {
		handler.Login(w, r, jwtCfg)
	})
	apiAuth := http.NewServeMux()
	apiAuth.HandleFunc("/me", middleware.RequireAuthContext(handler.Me))
	mux.Handle("/api/auth/", http.StripPrefix("/api/auth", middleware.Auth(jwtCfg)(apiAuth)))

	// API: import — Auth + inventory:create (order transaction)
	// Legacy endpoint kept for backward compatibility (no-op if not used)
	importHandler := http.HandlerFunc(handler.ImportOrderTransaction)
	importChain := middleware.Auth(jwtCfg)(middleware.RequirePermission(rbac.PermInventoryCreate)(middleware.Tenant(importHandler)))
	mux.Handle("/api/import/order-transaction", importChain)

	// API: inventory import (SKU/day source of truth)
	invImportHandler := http.HandlerFunc(handler.ImportInventory)
	invImportChain := middleware.Auth(jwtCfg)(middleware.RequirePermission(rbac.PermInventoryCreate)(middleware.Tenant(invImportHandler)))
	mux.Handle("/api/inventory/import", invImportChain)

	// API: inventory list
	invListHandler := http.HandlerFunc(handler.InventoryList)
	invListChain := middleware.Auth(jwtCfg)(middleware.RequirePermission(rbac.PermInventoryRead)(middleware.Tenant(invListHandler)))
	mux.Handle("/api/inventory", invListChain)

	// API: inventory summary
	invSummaryHandler := http.HandlerFunc(handler.InventorySummary)
	invSummaryChain := middleware.Auth(jwtCfg)(middleware.RequirePermission(rbac.PermInventoryRead)(middleware.Tenant(invSummaryHandler)))
	mux.Handle("/api/inventory/summary", invSummaryChain)

	// API: users — Auth then RequirePermission(users:read)
	usersHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			middleware.WriteJSONError(w, middleware.ErrMethodNotAllowed, http.StatusMethodNotAllowed)
			return
		}
		handler.UsersList(w, r)
	})
	usersChain := middleware.Auth(jwtCfg)(middleware.RequirePermission(rbac.PermUsersRead)(middleware.Tenant(usersHandler)))
	mux.Handle("/api/users", usersChain)

	// API: shops — POST /api/shops (Root only), GET/PATCH /api/shops/me (SuperAdmin), POST /api/shops/me/members (SuperAdmin)
	shopsCreateChain := middleware.Auth(jwtCfg)(middleware.RequirePermission(rbac.PermShopsCreate)(middleware.Tenant(http.HandlerFunc(handler.CreateShops))))
	mux.Handle("/api/shops", shopsCreateChain)

	shopsMeHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handler.GetShopsMe(w, r)
		case http.MethodPatch, http.MethodPut:
			handler.PatchShopsMe(w, r)
		default:
			middleware.WriteJSONError(w, middleware.ErrMethodNotAllowed, http.StatusMethodNotAllowed)
		}
	})
	shopsMeChain := middleware.Auth(jwtCfg)(middleware.RequirePermission(rbac.PermShopsUpdate)(middleware.Tenant(shopsMeHandler)))
	mux.Handle("/api/shops/me", shopsMeChain)

	shopsMeMembersHandler := http.HandlerFunc(handler.ShopsMeMembers)
	shopsMeMembersChain := middleware.Auth(jwtCfg)(middleware.RequirePermission(rbac.PermUsersCreate)(middleware.Tenant(shopsMeMembersHandler)))
	mux.Handle("/api/shops/me/members", shopsMeMembersChain)

	// API: self delete
	selfDeleteHandler := http.HandlerFunc(handler.DeleteSelf)
	selfDeleteChain := middleware.Auth(jwtCfg)(middleware.RequirePermission(rbac.PermUsersDelete)(middleware.Tenant(selfDeleteHandler)))
	mux.Handle("/api/users/me", selfDeleteChain)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	addr := ":" + port
	log.Printf("server listening on %s", addr)
	if err := http.ListenAndServe(addr, middleware.CORS(mux)); err != nil {
		log.Fatal(err)
	}
}
