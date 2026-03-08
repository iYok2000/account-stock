# Project-specific context (backend — สำหรับ AI)

อ่านไฟล์นี้ก่อนทำ task — เป็นกฎและบริบทของ backend ให้สอดคล้องกับ **account-stock-fe**

---

## ความสัมพันธ์กับ Frontend

- **account-stock-be** เป็นหลังบ้านของ **account-stock-fe** (Next.js, i18n, Tailwind).
- Spec หลักอยู่ที่ frontend repo: `docs/USER_SPEC.md`, `docs/RBAC_SPEC.md`, `docs/SHOPS_AND_ROLES_SPEC.md` — backend ต้อง implement ให้ตรงกับ spec เหล่านั้น.

---

## API สัญญา (API contract)

- Frontend ส่ง request พร้อม **Authorization: Bearer &lt;JWT&gt;** (token ได้จาก `POST /api/auth/login`).
- **ไม่รับ shop_id ใน body เป็น scope** — backend ดึง `shop_id` จาก user context (JWT) เสมอ.
- **`POST /api/auth/login`:** body `{ email, password, confirm_code? }`. คืน `{ token: "JWT" }`. Root ตรวจจาก env; user อื่นตรวจจาก DB + bcrypt.
- **`GET /api/auth/me`:** response ต้องมี `user.id`, `user.displayName`, `roles`, `permissions`, `tier`, `shop_id`, `shop_name` เพื่อให้ frontend ใช้กับ AuthContext / useUserContext.

---

## User context (จาก JWT)

ทุก request ที่ผ่าน auth ต้องได้ค่าดังนี้จาก middleware:

| ฟิลด์ | การใช้ |
|--------|--------|
| **user_id** (Subject) | ระบุผู้ใช้, audit log |
| **role** | ตรวจสิทธิ์ตาม RBAC (Root, SuperAdmin, Admin, Affiliate) |
| **tier** | จำกัดฟีเจอร์ตามระดับบริการ (free/paid) — ตรวจที่ backend เท่านั้น |
| **shop_id** | scope ข้อมูล multi-tenant — ทุก query/upsert ที่แยกตามร้านต้องใช้ค่านี้ (Root มีค่าว่าง) |
| **shop_name** | แสดงใน response (optional) |

---

## RBAC และ Multi-tenant

- **Permission:** รูปแบบ `resource:action` (เช่น `inventory:read`, `users:read`, `shops:create`). ต้องตรวจทุก endpoint ว่าผู้ใช้มี permission นั้น — Deny by Default.
- **Multi-tenant:** ตารางที่แยกตามร้านต้องมี `shop_id`; ทุก SELECT/UPDATE/INSERT/DELETE ต้อง scope ตาม `shop_id` ของ user ที่ล็อกอิน (ไม่ให้ร้าน A เห็น/แก้ข้อมูลร้าน B). Root ไม่มี shop_id — ใช้เฉพาะสร้างร้าน (POST /api/shops).
- **Tier:** ตรวจที่ backend เท่านั้น — ไม่พึ่ง frontend.

---

## โครงสร้างและกฎการ implement

- **Middleware:** (1) ดึง user context จาก JWT (2) ตรวจ permission ตาม resource:action สำหรับ route นั้น (3) inject / ตรวจ `shop_id` ให้ทุกการเข้าถึงข้อมูลที่แยกตามร้าน. ห้าม handler ข้ามหรือปิด middleware เหล่านี้.
- **Domain:** แยก handler ตาม domain (auth, users, shops, import, …). Logic ร่วมอยู่ที่ middleware และ auth; domain ไม่ข้าม domain โดยตรงถ้าผูกกับสิทธิ์/tenant โดยไม่ผ่านชั้นกลาง.
- **Audit log:** บันทึก `userId`, `resource`, `action`, `result` (allowed/denied), `timestamp` ตาม RBAC_SPEC.
- **Testing:** Unit/Integration tests สำหรับ enforcement สิทธิ์และ scope `shop_id`.

---

## อ้างอิง Spec

- **User & shop context:** `account-stock-fe/docs/USER_SPEC.md`, `account-stock-fe/docs/SHOPS_AND_ROLES_SPEC.md`
- **Entity, ER, กฎ inject shop_id:** this repo `docs/ENTITY_SPEC.md`
- **RBAC, roles, matrix:** `account-stock-fe/docs/RBAC_SPEC.md`, `account-stock-fe/docs/RBAC_BACKEND_SPEC.md`
- **Feature API (auth, shops, import):** this repo `docs/feature/01-auth.md`, `docs/feature/04-shops.md`, `docs/feature/03-import.md`
