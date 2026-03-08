# API Contract — Inventory Import & Summary

> ใช้ตารางเดียว `import_sku_row` เป็น source of truth (key: shop_id + date + sku_id). summary/daily เป็น optional สำหรับ UI; ไม่ต้องบันทึกซ้ำ.

## POST /api/inventory/import

Upsert รายการ SKU ต่อวันของร้าน (shop_id จาก token / session)

```jsonc
{
  "tier": "free" | "paid",
  "items": [
    {
      "date": "2026-02-22",
      "sku_id": "ABC-123",
      "name": "Congrats Good Skin",
      "seller_sku": "FS-UC-RR-100-B1G1",
      "product_name": "Congrats Good Skin 100g",
      "variation": "Brown",
      "quantity": 10,
      "revenue": 5990,
      "deductions": 650,
      "refund": 0,
      "net": 5340
    }
  ],
  "summary": { "totalRows": 100, "totalRevenue": 9999, "totalRefund": 0, "totalDeductions": 500, "dateFrom": "2026-02-20", "dateTo": "2026-02-22" },
  "daily": [ { "date": "2026-02-22", "revenue": 3000, "deductions_breakdown": { "total": 200 }, "refund": 0, "net": 2800 } ]
}
```

Response:
```json
{ "ok": true, "imported": 3, "updated": 5 }
```

**Upsert rule:** key = (shop_id, date, sku_id). ถ้ามีอยู่แล้ว → update ทุกฟิลด์ (quantity, revenue, deductions, refund, net, meta).

## GET /api/inventory

- คืนรายการ SKU ของร้าน (สามารถ map จาก import_sku_row หรือ inventory_items ถ้าเลือก sync ออก)
- ใช้ query param เช่น `?search=...&limit=...&cursor=...`

## GET /api/inventory/summary?period=current_month

รวมจาก import_sku_row:
```json
{
  "uniqueSkus": 42,
  "unitsThisMonth": 1234,
  "revenueThisMonth": 450000,
  "netThisMonth": 380000,
  "lastImport": "2026-02-22",
  "topSkus": [
    { "sku": "ABC-123", "name": "Congrats Good Skin", "quantity": 120, "revenue": 72000, "net": 64000, "date": "2026-02-22" }
  ]
}
```

## Note on Free vs Paid
- Free/paid ส่ง payload เดียวกัน (items มี date+sku) เพื่อลด duplication.
- Free UI: aggregate รายวันจาก items.
- Paid UI: แสดงราย SKU โดยตรง (และสามารถ aggregate รายวันจาก data เดียวกัน).
