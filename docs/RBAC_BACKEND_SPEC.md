# RBAC Backend Spec — สำหรับ Backend Dev

เอกสารนี้กำหนดสัญญา API, โมเดลสิทธิ์, และข้อกำหนดด้าน security/performance เพื่อให้ backend implement RBAC ให้ frontend เรียกใช้ได้ถูกต้อง

---

## 1. Security หลัก (ต้องทำทุกจุด)

- **Frontend ไม่ enforce สิทธิ์จริง** — ใช้แค่ซ่อน/แสดง UI เท่านั้น. **Backend ต้องตรวจสิทธิ์ทุก request** (ทุก endpoint ที่เกี่ยวกับ resource ที่มี RBAC).
- **Never trust client** — อย่าพึ่ง role/permission ที่ส่งมาจาก client; ดึงจาก session/token ที่ backend validate แล้วเท่านั้น.
- **Least privilege** — ส่งเฉพาะ permission list ที่ user มีจริง (ไม่ส่ง role ที่ไม่จำเป็นหรือข้อมูลละเอียดเกินไป).
- **Audit** — บันทึก log: ใคร, ทำอะไร, resource อะไร, เมื่อไหร่, ผล (success/denied). เก็บไว้สำหรับ compliance และ anomaly detection.

---

## 2. API สัญญาที่ Frontend ใช้

### 2.1 ดึง Session + Permissions (ต้องมี)

Frontend เรียก **ครั้งเดียวหลัง login / โหลดแอป** แล้ว cache ชั่วคราว (เช่น 5 นาที). ใช้สำหรับซ่อน/แสดงเมนูและปุ่มเท่านั้น; การเรียก API อื่นทุกครั้ง backend ต้องตรวจสิทธิ์เอง.

**Endpoint แนะนำ:** `GET /api/auth/me` หรือ `GET /auth/session` (ขึ้นกับโครง backend)

**Request:**

- ใช้ credential ที่ backend รับได้ (เช่น Cookie session, หรือ `Authorization: Bearer <token>`).
- ไม่ส่ง role/permission ใน request; backend หาจาก token/session เอง.

**Response (200):**

```json
{
  "user": {
    "id": "string (userId)",
    "displayName": "string (optional)"
  },
  "roles": ["Admin" | "Manager" | "Staff" | "Viewer"],
  "permissions": ["dashboard:read", "inventory:read", "inventory:create", ...]
}
```

- **roles:** array ของ role ที่ user มี (ตามที่ backend กำหนด).
- **permissions:** array ของ permission string รูปแบบ `resource:action` ตามรายการด้านล่าง. ต้องเป็น **union ของสิทธิ์จากทุก role** (รวม hierarchy ถ้ามี).

**Error:**

- **401 Unauthorized** — ไม่มีหรือหมด session/token → frontend จะใช้ mock/redirect login ตามที่ออกแบบ.
- **403 Forbidden** — ไม่ใช้กับ endpoint นี้ (ใช้กับ API ที่ทำ action กับ resource).

---

## 3. Permission Model (ให้ตรงกับ Frontend)

### 3.1 Resources

- `dashboard`, `inventory`, `orders`, `suppliers`, `reports`

### 3.2 Actions

- `read`, `create`, `update`, `delete`, `export`

### 3.3 Permission string

- รูปแบบ: `resource:action`
- ตัวอย่าง: `inventory:read`, `inventory:create`, `orders:update`, `reports:export`

### 3.4 การ map กับ UI (อ้างอิง)

| หน้าที่ / action ใน UI | Permission ที่ใช้ |
|------------------------|-------------------|
| เห็นเมนู Dashboard | `dashboard:read` |
| เห็นเมนู Inventory | `inventory:read` |
| เห็นเมนู Orders | `orders:read` |
| เห็นเมนู Suppliers | `suppliers:read` |
| เห็นเมนู Reports | `reports:read` |
| ปุ่ม Add Item (Inventory) | `inventory:create` |
| ปุ่ม Edit / Bulk Reorder (Inventory) | `inventory:update` |
| ปุ่ม Delete (Inventory) | `inventory:delete` |
| ปุ่ม Bulk Export (Inventory) | `inventory:export` |
| ปุ่ม Place Order | `orders:create` |

Backend ต้อง enforce ว่า **ทุก API ที่ทำ action กับ resource ต้องตรวจ permission ที่ตรงกัน** (เช่น สร้าง order ต้องมี `orders:create`).

---

## 4. Roles แนะนำและสิทธิ์ (อ้างอิง)

- **Viewer:** `*:read` (ทุก resource แค่ read).
- **Staff:** read ทุกที่ + `inventory:create|update|delete|export`, `orders:create|update|export`, `suppliers:read`.
- **Manager:** เท่ากับ Staff + `reports:read`, `reports:export`.
- **Admin:** ทุก permission.

รายละเอียด role → permissions ให้ backend เป็น source of truth (frontend มีแค่ fallback สำหรับ dev เมื่อยังไม่ต่อ API).

---

## 5. Performance

- **Cache ฝั่ง backend:** cache ผล “user → roles → permissions” ในหน่วยความจำ (หรือ cache layer) ด้วย TTL สั้น (เช่น 1–5 นาที) เพื่อลดโหลด DB/Catalog.
- **ดึง permission ครั้งเดียวต่อ request:** ใน request เดียวกัน ใช้ชุด permission เดิมทั้ง request (ไม่ query ใหม่ทุกครั้งที่เช็ค).
- **Index:** ถ้าเก็บ role/permission ใน DB ควรมี index ที่ใช้สำหรับ lookup ตาม userId / roleId.
- **Rate limit:** ใส่ rate limit ที่ `/api/auth/me` (หรือเทียบเท่า) เพื่อกัน abuse.

---

## 6. Audit

- บันทึกอย่างน้อย: **timestamp, userId, resource, action, result (success/denied), IP/request id**.
- กรณี **access denied** ควร log ให้ชัดว่าเป็นเพราะไม่มีสิทธิ์ (403) เพื่อใช้วิเคราะห์และ compliance.

---

## 7. สรุป Checklist สำหรับ Backend

- [ ] มี endpoint ดึง session + permissions ตามรูปแบบด้านบน (เช่น `GET /api/auth/me`).
- [ ] ทุก API ที่เกี่ยวกับ dashboard/inventory/orders/suppliers/reports ตรวจ permission ก่อนทำ action.
- [ ] ไม่พึ่ง role/permission จาก request body/query; ดึงจาก session/token เท่านั้น.
- [ ] Response permissions เป็น array ของ `resource:action` ตรงกับโมเดลด้านบน.
- [ ] มี cache (และ TTL) สำหรับ user → permissions เพื่อ performance.
- [ ] มี audit log สำหรับการเข้าถึงและผล (success/denied).

---

*Frontend ใช้ doc นี้เป็นสัญญาในการเรียก `GET /api/auth/me` และใช้ค่า `permissions` ในการซ่อน/แสดง UI เท่านั้น; การควบคุมการเข้าถึงจริงทำที่ backend เท่านั้น.*
