# Feature Spec — Import (Order Transaction → Inventory)

API สำหรับรับ payload order-transaction จาก frontend Import Wizard แล้ว **บันทึกเป็น SKU/วัน** (source of truth) เพื่อนำไปแสดง Inventory/Dashboard. ต้องส่ง JWT และมีสิทธิ์ `inventory:create`.

---

## Route & Permission

| Method | Path | Auth | Permission | Description |
|--------|------|------|-------------|-------------|
| POST | `/api/inventory/import` | Required (JWT) | `inventory:create` | Upsert SKU ต่อวัน (key: shop_id + date + sku_id) จาก payload items; summary/daily เป็น optional สำหรับ UI |
| GET | `/api/inventory` | Required (JWT) | `inventory:read` | รายการ SKU ของร้าน (map จาก import_sku_row / inventory view) |
| GET | `/api/inventory/summary?period=current_month` | Required (JWT) | `inventory:read` | รวมจาก import_sku_row (uniqueSkus, units, revenue, net, lastImport, topSkus) |

- **CORS:** ต้องตั้ง `CORS_ORIGIN` (หรือ default localhost/127.0.0.1) เพื่อให้ frontend เรียกได้จาก browser. ดู `internal/middleware/cors.go`.
- **Auth:** ไม่มี token หรือ token หมดอายุ → 401. ไม่มีสิทธิ์ `inventory:create` → 403.

---

## Request (POST /api/inventory/import)

- **Header:** `Authorization: Bearer <JWT>`, `Content-Type: application/json`
- **Body:** 
```jsonc
{
  "tier": "free" | "paid",
  "items": [
    { "date": "2026-02-22", "sku_id": "ABC-123", "seller_sku": "...", "product_name": "...", "variation": "...",
      "quantity": 10, "revenue": 5990, "deductions": 650, "refund": 0, "net": 5340 }
  ],
  "summary": { "totalRows": 100, "totalRevenue": 9999, "totalRefund": 0, "totalDeductions": 500, "dateFrom": "2026-02-20", "dateTo": "2026-02-22" },
  "daily": [ { "date": "2026-02-22", "revenue": 3000, "deductions_breakdown": { "total": 200 }, "refund": 0, "net": 2800 } ]
}
```
- **Upsert rule:** key = (shop_id, date, sku_id) จาก auth context. ถ้าซ้ำให้ update ฟิลด์ทั้งหมด (quantity, revenue, deductions, refund, net, meta)

## Response (200)

```json
{ "ok": true, "imported": 3, "updated": 5 }
```

## Tenant scope

- ใช้ `shop_id`/`company_id` จาก auth context เสมอ (ไม่อ่านจาก body)

## สถานะ

- ต้อง implement handler ใหม่ `/api/inventory/import`, `/api/inventory/summary`, `/api/inventory`.
- schema แนะนำ: ตารางเดียว `import_sku_row` (shop_id, date, sku_id, seller_sku, product_name, variation, quantity, revenue, deductions, refund, net, created_at, updated_at) ดัชนี unique (shop_id, date, sku_id).
