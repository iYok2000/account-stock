# Feature Spec — Import (Order Transaction)

API สำหรับรับ payload order-transaction จาก frontend Import Wizard (stub; ยังไม่บันทึก DB). **Production:** ต้องส่ง JWT และมีสิทธิ์ `orders:create`.

---

## Route & Permission

| Method | Path | Auth | Permission | Description |
|--------|------|------|-------------|-------------|
| POST | `/api/import/order-transaction` | Required (JWT) | `orders:create` | รับ JSON มี `tier`, `summary`, `daily` หรือ `items`; คืน 200 + `{"ok":true}` |

- **CORS:** ต้องตั้ง `CORS_ORIGIN` (หรือ default localhost/127.0.0.1) เพื่อให้ frontend เรียกได้จาก browser. ดู `internal/middleware/cors.go`.
- **Auth:** ไม่มี token หรือ token หมดอายุ → 401. ไม่มีสิทธิ์ `orders:create` → 403.

---

## Request

- **Header:** `Authorization: Bearer <JWT>`, `Content-Type: application/json`
- **Body (tier = free):** `{ "tier": "free", "summary": {...}, "daily": [...] }`
- **Body (tier = paid):** `{ "tier": "paid", "summary": {...}, "items": [...] }`

---

## Response (200)

```json
{ "ok": true }
```

---

## Tenant scope

- **ปัจจุบัน (stub):** ไม่ query DB จึงยังไม่ใช้ company_id.
- **เมื่อบันทึก DB:** ต้องใช้ `company_id` จาก auth context เท่านั้น (middleware.TenantScope) สำหรับ insert/update ตาม ENTITY_SPEC §4.

---

## สถานะปัจจุบัน

- **Handler:** `internal/handler/import.go` — รับ POST, decode JSON, คืน 200 + `{"ok":true}`. ยังไม่บันทึก DB.
- **Auth:** ตรวจ JWT + RequirePermission(orders:create). พร้อม production ตาม DEPLOY.md.
- **Frontend spec:** ฟิลด์และ payload ตาม `account-stock-fe/docs/feature/07-import.md` (15 ฟิลด์, จับคู่ตรง/ใกล้เคียง).
