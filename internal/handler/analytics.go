package handler

import (
	"net/http"
	"time"

	"account-stock-be/internal/auth"
	"account-stock-be/internal/database"
	"account-stock-be/internal/middleware"
	"gorm.io/gorm"
)

var tzBangkok = time.FixedZone("Asia/Bangkok", 7*3600)

// ─── DB row types ─────────────────────────────────────────────────────────────

type importRow struct {
	Date        time.Time `gorm:"column:date"`
	Revenue     float64   `gorm:"column:revenue"`
	Net         float64   `gorm:"column:net"`
	Deductions  float64   `gorm:"column:deductions"`
	Refund      float64   `gorm:"column:refund"`
	Quantity    float64   `gorm:"column:quantity"`
	SKUID       string    `gorm:"column:sku_id"`
	ProductName string    `gorm:"column:product_name"`
	ShopID      string    `gorm:"column:shop_id"`
}

type affiliateAnalyticsRow struct {
	OrderDate        time.Time `gorm:"column:order_date"`
	GMV              float64   `gorm:"column:gmv"`
	CommissionAmount float64   `gorm:"column:commission_amount"`
	IneligibleAmount float64   `gorm:"column:ineligible_amount"`
	ItemsSold        float64   `gorm:"column:items_sold"`
	SKUID            string    `gorm:"column:sku_id"`
	ProductName      string    `gorm:"column:product_name"`
}

// ─── Aggregation structs ──────────────────────────────────────────────────────

type importAgg struct {
	GMV        float64
	Settlement float64
	Deductions float64
	Refund     float64
}

type affiliateAgg struct {
	GMV        float64
	Earned     float64
	Ineligible float64
}

type dailyMetric struct {
	revenue    float64
	profit     float64
	settlement float64
}

type skuMetric struct {
	name     string
	quantity float64
	revenue  float64
	profit   float64
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

func shopIDsForContext(db *gorm.DB, ctx *auth.Context) ([]string, error) {
	if ctx == nil {
		return nil, nil
	}
	if ctx.ShopID != "" {
		return []string{ctx.ShopID}, nil
	}
	if ctx.CompanyID != "" {
		var ids []string
		if err := db.Table("shops").Select("id").Where("company_id = ?", ctx.CompanyID).Pluck("id", &ids).Error; err != nil {
			return nil, err
		}
		return ids, nil
	}
	return nil, nil
}

func fetchImportRows(db *gorm.DB, shopIDs []string, from, to time.Time) ([]importRow, error) {
	query := db.Table("import_sku_row").
		Select("date, revenue, net, deductions, refund, quantity, sku_id, product_name, shop_id").
		Where("deleted_at IS NULL").
		Where("date BETWEEN ? AND ?", from, to)
	if len(shopIDs) > 0 {
		query = query.Where("shop_id IN ?", shopIDs)
	}
	var rows []importRow
	if err := query.Find(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

func fetchAffiliateRows(db *gorm.DB, companyID, userID string, from, to time.Time) ([]affiliateAnalyticsRow, error) {
	var rows []affiliateAnalyticsRow
	if err := db.Table("affiliate_sku_row").
		Select("order_date, gmv, commission_amount, ineligible_amount, items_sold, sku_id, product_name").
		Where("company_id = ? AND user_id = ? AND order_date BETWEEN ? AND ?", companyID, userID, from, to).
		Find(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

func parseDateRange(r *http.Request) (time.Time, time.Time) {
	end := time.Now().In(tzBangkok).Truncate(24 * time.Hour)
	start := end.AddDate(0, 0, -29)
	if v := r.URL.Query().Get("from"); v != "" {
		if t, err := time.Parse("2006-01-02", v); err == nil {
			start = time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, tzBangkok)
		}
	}
	if v := r.URL.Query().Get("to"); v != "" {
		if t, err := time.Parse("2006-01-02", v); err == nil {
			end = time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, tzBangkok)
		}
	}
	if end.Before(start) {
		start, end = end, start
	}
	return start, end
}

// ─── Go-side aggregation ──────────────────────────────────────────────────────

func aggregateImport(rows []importRow) importAgg {
	var a importAgg
	for _, r := range rows {
		a.GMV += r.Revenue
		a.Settlement += r.Net
		a.Deductions += r.Deductions
		a.Refund += r.Refund
	}
	return a
}

func aggregateAffiliate(rows []affiliateAnalyticsRow) affiliateAgg {
	var a affiliateAgg
	for _, r := range rows {
		a.GMV += r.GMV
		a.Earned += r.CommissionAmount
		a.Ineligible += r.IneligibleAmount
	}
	return a
}

func importToDailyMap(rows []importRow) map[string]*dailyMetric {
	m := make(map[string]*dailyMetric)
	for _, r := range rows {
		key := r.Date.Format("2006-01-02")
		d := m[key]
		if d == nil {
			d = &dailyMetric{}
			m[key] = d
		}
		d.revenue += r.Revenue
		d.profit += r.Net
		d.settlement += r.Net
	}
	return m
}

func affiliateToDailyMap(rows []affiliateAnalyticsRow) map[string]*dailyMetric {
	m := make(map[string]*dailyMetric)
	for _, r := range rows {
		key := r.OrderDate.Format("2006-01-02")
		d := m[key]
		if d == nil {
			d = &dailyMetric{}
			m[key] = d
		}
		d.revenue += r.CommissionAmount
		d.profit += r.CommissionAmount - r.IneligibleAmount
		d.settlement += r.CommissionAmount
	}
	return m
}

func importToSkuMap(rows []importRow) map[string]*skuMetric {
	m := make(map[string]*skuMetric)
	for _, r := range rows {
		s := m[r.SKUID]
		if s == nil {
			name := r.ProductName
			if name == "" {
				name = r.SKUID
			}
			s = &skuMetric{name: name}
			m[r.SKUID] = s
		}
		if r.ProductName != "" {
			s.name = r.ProductName
		}
		s.quantity += r.Quantity
		s.revenue += r.Revenue
		s.profit += r.Net
	}
	return m
}

func affiliateToSkuMap(rows []affiliateAnalyticsRow) map[string]*skuMetric {
	m := make(map[string]*skuMetric)
	for _, r := range rows {
		s := m[r.SKUID]
		if s == nil {
			name := r.ProductName
			if name == "" {
				name = r.SKUID
			}
			s = &skuMetric{name: name}
			m[r.SKUID] = s
		}
		if r.ProductName != "" {
			s.name = r.ProductName
		}
		s.quantity += r.ItemsSold
		s.revenue += r.CommissionAmount
		s.profit += r.CommissionAmount - r.IneligibleAmount
	}
	return m
}

// ─── Response writers ─────────────────────────────────────────────────────────

func writeDailyMetrics(w http.ResponseWriter, dayMap map[string]*dailyMetric, from, to time.Time) {
	days := int(to.Sub(from).Hours()/24) + 1
	timeSeries := make([]map[string]interface{}, 0, days)
	var totalRevenue, totalProfit float64
	for i := 0; i < days; i++ {
		d := from.AddDate(0, 0, i)
		key := d.Format("2006-01-02")
		if v, ok := dayMap[key]; ok {
			timeSeries = append(timeSeries, map[string]interface{}{
				"label":      key,
				"revenue":    v.revenue,
				"profit":     v.profit,
				"settlement": v.settlement,
			})
			totalRevenue += v.revenue
			totalProfit += v.profit
		} else {
			timeSeries = append(timeSeries, map[string]interface{}{
				"label":      key,
				"revenue":    0,
				"profit":     0,
				"settlement": 0,
			})
		}
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"hasData":    totalRevenue > 0 || totalProfit > 0,
		"totals":     map[string]float64{"revenue": totalRevenue, "profit": totalProfit, "settlement": totalProfit},
		"timeSeries": timeSeries,
		"from":       from.Format("2006-01-02"),
		"to":         to.Format("2006-01-02"),
	})
}

func writeProductMetrics(w http.ResponseWriter, skuMap map[string]*skuMetric, from, to time.Time) {
	out := make([]map[string]interface{}, 0, len(skuMap))
	for skuID, s := range skuMap {
		var margin *float64
		if s.revenue > 0 {
			m := (s.profit / s.revenue) * 100
			margin = &m
		}
		out = append(out, map[string]interface{}{
			"skuId":        skuID,
			"name":         s.name,
			"category":     "general",
			"quantity":     s.quantity,
			"revenue":      s.revenue,
			"profit":       s.profit,
			"profitMargin": margin,
			"hasCost":      false,
		})
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"products": out,
		"hasData":  len(out) > 0,
		"from":     from.Format("2006-01-02"),
		"to":       to.Format("2006-01-02"),
	})
}

// ─── GET /api/analytics/reconciliation ───────────────────────────────────────

func AnalyticsReconciliation(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		middleware.WriteJSONError(w, middleware.ErrMethodNotAllowed, http.StatusMethodNotAllowed)
		return
	}
	ctx := middleware.GetContext(r.Context())
	if ctx == nil {
		middleware.WriteJSONError(w, middleware.ErrUnauthorized, http.StatusUnauthorized)
		return
	}
	db := database.DB()
	if db == nil {
		middleware.WriteJSONErrorMsg(w, "database not initialized", http.StatusInternalServerError)
		return
	}
	from, to := parseDateRange(r)

	// Affiliate branch
	if ctx.Role == auth.RoleAffiliate {
		if ctx.CompanyID == "" || ctx.UserID == "" {
			middleware.WriteJSONError(w, middleware.ErrUnauthorized, http.StatusUnauthorized)
			return
		}
		rows, err := fetchAffiliateRows(db, ctx.CompanyID, ctx.UserID, from, to)
		if err != nil {
			middleware.WriteJSONError(w, middleware.ErrInternal, http.StatusInternalServerError)
			return
		}
		a := aggregateAffiliate(rows)
		totalFees := a.Ineligible
		net := a.Earned - totalFees
		settlementRate := 0.0
		if a.GMV > 0 {
			settlementRate = (a.Earned / a.GMV) * 100
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"gmv":            a.GMV,
			"settlement":     a.Earned,
			"totalFees":      totalFees,
			"netProfit":      net,
			"settlementRate": settlementRate,
			"feeBreakdown":   []map[string]interface{}{{"label": "ineligible", "value": totalFees}},
			"from":           from.Format("2006-01-02"),
			"to":             to.Format("2006-01-02"),
		})
		return
	}

	// Owner / Admin / Root branch — shopIDsForContext handles all scoping
	shopIDs, err := shopIDsForContext(db, ctx)
	if err != nil {
		middleware.WriteJSONError(w, middleware.ErrInternal, http.StatusInternalServerError)
		return
	}
	rows, err := fetchImportRows(db, shopIDs, from, to)
	if err != nil {
		middleware.WriteJSONError(w, middleware.ErrInternal, http.StatusInternalServerError)
		return
	}
	a := aggregateImport(rows)
	totalFees := a.GMV - a.Settlement
	if totalFees < 0 {
		totalFees = 0
	}
	settlementRate := 0.0
	if a.GMV > 0 {
		settlementRate = (a.Settlement / a.GMV) * 100
	}
	// tiktokCommission = implied platform cut (GMV - settlement - deductions - refund)
	tiktokFee := totalFees - a.Deductions - a.Refund
	if tiktokFee < 0 {
		tiktokFee = 0
	}

	feeBreakdown := []map[string]interface{}{
		{"label": "tiktokCommission", "value": tiktokFee},
		{"label": "deductions", "value": a.Deductions},
		{"label": "refund", "value": a.Refund},
	}
	// filter out zero-value items to keep the chart clean
	filteredBreakdown := make([]map[string]interface{}, 0, len(feeBreakdown))
	for _, item := range feeBreakdown {
		if v, ok := item["value"].(float64); ok && v > 0 {
			filteredBreakdown = append(filteredBreakdown, item)
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"gmv":            a.GMV,
		"settlement":     a.Settlement,
		"totalFees":      totalFees,
		"netProfit":      a.Settlement,
		"settlementRate": settlementRate,
		"feeBreakdown":   filteredBreakdown,
		"from":           from.Format("2006-01-02"),
		"to":             to.Format("2006-01-02"),
	})
}

// ─── GET /api/analytics/daily-metrics ────────────────────────────────────────

func AnalyticsDailyMetrics(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		middleware.WriteJSONError(w, middleware.ErrMethodNotAllowed, http.StatusMethodNotAllowed)
		return
	}
	ctx := middleware.GetContext(r.Context())
	if ctx == nil {
		middleware.WriteJSONError(w, middleware.ErrUnauthorized, http.StatusUnauthorized)
		return
	}
	db := database.DB()
	if db == nil {
		middleware.WriteJSONErrorMsg(w, "database not initialized", http.StatusInternalServerError)
		return
	}
	from, to := parseDateRange(r)

	if ctx.Role == auth.RoleAffiliate {
		if ctx.CompanyID == "" || ctx.UserID == "" {
			middleware.WriteJSONError(w, middleware.ErrUnauthorized, http.StatusUnauthorized)
			return
		}
		rows, err := fetchAffiliateRows(db, ctx.CompanyID, ctx.UserID, from, to)
		if err != nil {
			middleware.WriteJSONError(w, middleware.ErrInternal, http.StatusInternalServerError)
			return
		}
		writeDailyMetrics(w, affiliateToDailyMap(rows), from, to)
		return
	}

	shopIDs, err := shopIDsForContext(db, ctx)
	if err != nil {
		middleware.WriteJSONError(w, middleware.ErrInternal, http.StatusInternalServerError)
		return
	}
	rows, err := fetchImportRows(db, shopIDs, from, to)
	if err != nil {
		middleware.WriteJSONError(w, middleware.ErrInternal, http.StatusInternalServerError)
		return
	}
	writeDailyMetrics(w, importToDailyMap(rows), from, to)
}

// ─── GET /api/analytics/product-metrics ──────────────────────────────────────

func AnalyticsProductMetrics(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		middleware.WriteJSONError(w, middleware.ErrMethodNotAllowed, http.StatusMethodNotAllowed)
		return
	}
	ctx := middleware.GetContext(r.Context())
	if ctx == nil {
		middleware.WriteJSONError(w, middleware.ErrUnauthorized, http.StatusUnauthorized)
		return
	}
	db := database.DB()
	if db == nil {
		middleware.WriteJSONErrorMsg(w, "database not initialized", http.StatusInternalServerError)
		return
	}
	from, to := parseDateRange(r)

	if ctx.Role == auth.RoleAffiliate {
		if ctx.CompanyID == "" || ctx.UserID == "" {
			middleware.WriteJSONError(w, middleware.ErrUnauthorized, http.StatusUnauthorized)
			return
		}
		rows, err := fetchAffiliateRows(db, ctx.CompanyID, ctx.UserID, from, to)
		if err != nil {
			middleware.WriteJSONError(w, middleware.ErrInternal, http.StatusInternalServerError)
			return
		}
		writeProductMetrics(w, affiliateToSkuMap(rows), from, to)
		return
	}

	shopIDs, err := shopIDsForContext(db, ctx)
	if err != nil {
		middleware.WriteJSONError(w, middleware.ErrInternal, http.StatusInternalServerError)
		return
	}
	rows, err := fetchImportRows(db, shopIDs, from, to)
	if err != nil {
		middleware.WriteJSONError(w, middleware.ErrInternal, http.StatusInternalServerError)
		return
	}
	writeProductMetrics(w, importToSkuMap(rows), from, to)
}
