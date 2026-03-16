# Spec — ร้านค้า (Shop) และ Role แบบ Multi-Tenant

> อัปเดตตามความต้องการ: Role เหลือ Root, SuperAdmin, Admin, Affiliate. 1 user : 1 shop. Root สร้างร้าน+SuperAdmin; SuperAdmin จัดการสมาชิกในร้าน.

---

## 1. บทบาท (Roles) — 4 แบบ

| Role | ระดับ | ผูกกับร้าน | สิทธิ์หลัก |
|------|--------|------------|------------|
| **Root** | แพลตฟอร์ม (มีแค่ 1 account) | ไม่ผูก (ไม่มี shop_id) | Login ได้ด้วย email/password + รหัสยืนยัน (จาก env). **สร้างร้านค้า** พร้อมใส่สมาชิก (อย่างน้อย 1 SuperAdmin) ได้เท่านั้น |
| **SuperAdmin** | ระดับร้าน | 1 ร้าน (shop_id) | เห็นทั้งหมดของร้าน, **จัดการชื่อร้าน**, **จัดการสมาชิก** (เพิ่ม Admin/Affiliate), ทุกฟีเจอร์ของร้าน |
| **Admin** | ระดับร้าน | 1 ร้าน | เห็นและใช้งานทุกอย่างของร้าน **ยกเว้น** จัดการสมาชิกและแก้ชื่อร้าน |
| **Affiliate** | ระดับร้าน | 1 ร้าน | เห็นเฉพาะ Dashboard + **Import (Affiliate)** — นำเข้าไฟล์คอมมิชชัน |

- **1 account = 1 ร้าน** ณ ตอนนี้ (email unique ทั้งระบบ).
- ทุก action ของ SuperAdmin/Admin/Affiliate ผูกกับ **shop_id** ของ user นั้นเสมอ (multi-tenant).

---

## 2. Root account และการ Login

- **Root มีคนเดียว:** เป็นคุณ (platform owner). ใช้สำหรับสร้างร้านและ SuperAdmin ให้ร้านเท่านั้น.
- **Credentials + รหัสยืนยัน (hardcode ใน env):**
  - Email: `superadmin`
  - Password: `pass@1congrate`
  - รหัสยืนยัน: `YIM2021`
- **Env vars (server-side เท่านั้น):**
  - `ROOT_EMAIL=superadmin`
  - `ROOT_PASSWORD=pass@1congrate`
  - `ROOT_CONFIRM_CODE=YIM2021`
- **Flow การ login:**
  1. User กรอก email + password.
  2. ถ้าเท่ากับ Root (จาก env) → แสดงช่อง "รหัสยืนยัน" แล้วตรวจกับ `ROOT_CONFIRM_CODE`. ผ่าน → login เป็น **Root** (ไม่มี shop_id).
  3. ไม่ใช่ Root → เรียก API login ตามปกติ (backend คืน user + role + shop_id).

---

## 3. การสร้างร้านค้า (Root เท่านั้น)

- **ใครเข้าได้:** เฉพาะผู้ที่ login เป็น **Root**.
- **ขั้นตอนเดียว:** สร้างร้านและใส่สมาชิกไปพร้อมกัน.
- **ฟอร์ม "สร้างร้านค้า":**
  - **ชื่อร้าน** (บังคับ)
  - **สมาชิก** (อย่างน้อย 1 คน):
    - อีเมล (บังคับ, unique)
    - รหัสผ่าน (บังคับ)
    - บทบาท (Role): **SuperAdmin** (ต้องมีอย่างน้อย 1 คนที่เป็น SuperAdmin ต่อ 1 ร้าน)
  - ปุ่ม "เพิ่มสมาชิก" เพื่อเพิ่มแถว (อีเมล + รหัสผ่าน + เลือก Role). อย่างน้อยหนึ่งคนต้องเป็น SuperAdmin.
- **Constraint:** email ไม่ซ้ำทั้งระบบ (1 user : 1 shop; backend ต้อง unique email).
- **API (สำหรับ Backend):**
  - `POST /api/shops` (Auth: Root only)
  - Body: `{ "name": "ชื่อร้าน", "members": [ { "email": "...", "password": "...", "role": "SuperAdmin" } ] }`
  - ต้องมี member อย่างน้อย 1 คน และ role = SuperAdmin. สร้าง shop แล้วสร้าง user(s) ผูก shop_id.

---

## 4. การเพิ่มสมาชิกในร้าน (SuperAdmin เท่านั้น)

- **ใครทำได้:** เฉพาะ **SuperAdmin** ของร้านนั้น.
- **ฟอร์ม "เพิ่มสมาชิก":**
  - อีเมล (บังคับ)
  - รหัสผ่าน (บังคับ)
  - บทบาท: **Admin** หรือ **Affiliate** (ไม่ให้สร้าง SuperAdmin ใหม่จากฟอร์มนี้; SuperAdmin เกิดตอนสร้างร้านเท่านั้น)
- **ผูกกับร้าน:** สมาชิกที่สร้างจะได้ **shop_id = ร้านของ SuperAdmin ที่ล็อกอิน** อัตโนมัติ.
- **API (สำหรับ Backend):**
  - `POST /api/shops/current/members` หรือ `POST /api/shops/:shopId/members` (Auth: SuperAdmin of that shop)
  - Body: `{ "email": "...", "password": "...", "role": "Admin" | "Affiliate" }`
  - Backend ตรวจว่า requester เป็น SuperAdmin และ inject shop_id จาก session.

---

## 5. โมเดลข้อมูล (Backend)

### Shop
- `id` (PK)
- `name` (ชื่อร้าน)
- `created_at`, `updated_at` (ถ้ามี)

### User
- `id` (PK)
- `email` (unique ทั้งระบบ)
- `password_hash`
- `shop_id` (FK, nullable — null เฉพาะ Root)
- `role`: `"Root" | "SuperAdmin" | "Admin" | "Affiliate"`
- `created_at`, `updated_at` (ถ้ามี)

- **Constraint:** 1 user มีได้แค่ 1 shop (หนึ่ง email ต่อหนึ่ง shop_id). Root มีได้คนเดียว (เช็คที่ application level หรือ constraint).

---

## 6. Auth / Session หลัง Login

- **Root:** `role: "Root"`, `shop_id: null`. ไม่มีเมนู "ร้านของฉัน" แต่มีเมนู "สร้างร้านค้า".
- **SuperAdmin / Admin / Affiliate:** `role`, `shop_id`, `shop_name` (ถ้า API ส่งมา). ทุก request ที่เกี่ยวกับข้อมูลร้านส่ง `shop_id` หรือ backend ดึงจาก token/session.
- **Token / GET /api/auth/me:** คืน `user.id`, `user.email`, `roles: [role]`, `shop_id`, `shop_name` (optional), `permissions` (ตาม role).

---

## 7. Frontend (สรุป)

- **Login หน้า:** ช่อง email, password; ถ้าเป็น Root (เทียบกับ env) → แสดงช่อง "รหัสยืนยัน", ตรวจ `YIM2021` แล้ว login เป็น Root.
- **เมนูตาม Role:**
  - **Root:** Dashboard, **สร้างร้านค้า**.
  - **SuperAdmin:** Dashboard, Inventory, Orders, Import, …, **จัดการร้าน / สมาชิก**, Settings (ตามที่กำหนด).
  - **Admin:** เหมือน SuperAdmin แต่ **ไม่มี** จัดการร้าน/สมาชิก.
  - **Affiliate:** Dashboard, **Import** (เฉพาะ Affiliate).
- **หน้า "สร้างร้านค้า":** ฟอร์มชื่อร้าน + รายการสมาชิก (email, password, role) อย่างน้อย 1 SuperAdmin. เรียก `POST /api/shops`.
- **หน้า "จัดการร้าน" (หรือภายใต้ Shops):** แก้ชื่อร้านได้ (SuperAdmin), แสดงรายชื่อสมาชิก, ปุ่ม "เพิ่มสมาชิก" → ฟอร์ม email + password + role (Admin | Affiliate). เรียก `POST /api/shops/current/members` (หรือเทียบเท่า).

---

## 8. Backend (สรุป)

- สร้าง/ใช้ตาราง `shops`, `users` ตามโมเดลด้านบน.
- Auth: รับ login (email + password); ถ้าเป็น Root (เทียบกับ env ที่ server) + รหัสยืนยัน → ออก token เป็น Root. ไม่เช่นนั้นตรวจ password แล้วออก token พร้อม role + shop_id.
- `POST /api/shops` — Root only; body มี name + members; สร้าง shop และ user(s) (hash password, role, shop_id).
- `GET /api/shops` — Root only (list ร้าน); หรือ SuperAdmin เห็นแค่ร้านตัวเอง.
- `PATCH /api/shops/:id` — SuperAdmin of that shop; แก้ชื่อร้าน.
- `GET /api/shops/:id/members` — SuperAdmin of that shop.
- `POST /api/shops/:id/members` — SuperAdmin of that shop; body email, password, role (Admin|Affiliate); สร้าง user ผูก shop_id.
- ทุก API ที่เกี่ยวกับข้อมูลร้าน (inventory, import, …) ใช้ `shop_id` จาก token เป็น scope.

---

## 9. Env (สรุป)

| ตัวแปร | ความหมาย | ตัวอย่าง |
|--------|----------|----------|
| `ROOT_EMAIL` | Email สำหรับ login Root (server-side) | `superadmin` |
| `ROOT_PASSWORD` | รหัสผ่าน Root (server-side) | `pass@1congrate` |
| `ROOT_CONFIRM_CODE` | รหัสยืนยันสำหรับ login Root (server-side) | `YIM2021` |

หมายเหตุ: ใน production ควรให้ Root login ผ่าน backend เท่านั้น (ส่ง email/password/confirmCode ไป API) และไม่ใส่ password/confirm ใน client env.

---

## 10. อ้างอิง Spec อื่น

- **FE:** [USER_SPEC.md](USER_SPEC.md) (context shopId/shopName), [RBAC_SPEC.md](RBAC_SPEC.md), [ROLES_SUMMARY.md](ROLES_SUMMARY.md), [RBAC_BACKEND_SPEC.md](RBAC_BACKEND_SPEC.md) (API contract).
- **BE:** `account-stock-be/docs/feature/01-auth.md`, `docs/feature/04-shops.md`, `project-specific_context.md`, `docs/ENTITY_SPEC.md`.
