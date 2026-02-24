# User Spec — User context (รองรับหลายเจ้า)

ระบบออกแบบให้รองรับ **หลายเจ้า (multi-tenant)** — user ควรมี context ดังนี้

---

## ความสัมพันธ์กับ RBAC

- **แยกหน้าที่ชัดเจน:** [RBAC_SPEC.md](RBAC_SPEC.md) จัดการ **สิทธิ์เข้าถึง** (resource:action ตาม role). **tier** และ **company** จัดการ **ขีดความสามารถฟีเจอร์** และ **scope ข้อมูลตาม tenant** — ไม่อยู่ใน RBAC.
- **role** ใช้ตรวจสิทธิ์ (permission) ตาม RBAC — ค่าของ role เป็นไปตาม Roles (SuperAdmin, Admin, Manager, Staff, Viewer).
- **tier** และ **company** เป็นส่วนเสริมของ user context สำหรับฟีเจอร์ที่แยกตามระดับบริการและตามเจ้า.

---

## ฟิลด์ใน user context

| ฟิลด์ | ความหมาย | การใช้ |
|--------|-----------|--------|
| **role** | บทบาทตาม RBAC (SuperAdmin, Admin, Manager, Staff, Viewer) | ใช้ตรวจสิทธิ์ resource:action ตาม [RBAC_SPEC.md](RBAC_SPEC.md) |
| **tier** | ระดับบริการ (free / paid) | กำหนดขีดความสามารถของฟีเจอร์ เช่น Import ฟรี vs paid (สรุประดับวัน vs 1 SKU = 1 record, การ get ระดับวัน/เดือน) |
| **company** | บริษัท/เจ้า (tenant) | **แยกข้อมูลต่อเจ้า** — ข้อมูลที่แยกตามเจ้าต้องมี `company_id`; query/upsert scope ตาม company_id ของ user ที่ล็อกอิน |

---

## Backend

- รับ request ต้องรู้ว่า request มาจาก user คนไหน (จาก token/session) → ได้ **user_id, role, tier, company_id**
- บันทึก/query ข้อมูลที่แยกตามเจ้า ใช้ **company_id** เป็น scope เสมอ (ไม่ให้เจ้า A เห็นข้อมูลเจ้า B)
- **Enforcement ต้องเข้มงวด** โดยเฉพาะใน multi-tenant — ป้องกันข้อมูลรั่วไหลข้าม tenant และสิทธิ์ผิดพลาด

### แนะนำการ implement

- **Middleware / Interceptor:** ใช้ชั้นกลางสำหรับ (1) ดึง user context จาก token/session (2) ตรวจสอบ permission ตาม RBAC (3) inject / ตรวจ **company_id** ให้ทุก query/upsert ถูก scope — ลดความซ้ำซ้อนและช่องโหว่
- **Token:** อัปเดต permissions (และ role, tier, company_id) ใน JWT หรือ response `/api/auth/me` ให้ถูกต้อง เพื่อให้ backend เช็คสิทธิ์ได้ทันทีและแม่นยำ
- **Tier:** ตรวจสอบสิทธิ์ tier ที่ **backend เท่านั้น** — ไม่พึ่ง frontend (ไม่ปลอดภัย)

---

## Frontend

- ส่ง request ไป API พร้อม **auth header**
- ไม่จำเป็นต้องส่ง company ใน body — backend ดึงจาก user context

### Implementation (store + HOC)

- **Store:** User context เก็บใน `AuthContext` (session state) — ฟิลด์ใน session: `userId`, `roles`, `permissions`, `displayName`, `tier?`, `companyId?`. API `/api/auth/me` คาด response มี `tier`, `company_id`; mock/dev ใช้ `tier: "free"`, `companyId: "default"`.
- **Types:** `UserSession`, `UserTier` ("free" | "paid") ใน `lib/rbac/types.ts`; `MeResponse` รองรับ `tier`, `company_id`.
- **Hook:** `useUserContext()` คืนค่า `{ userId, role, roles, tier, companyId, displayName, permissions }` จาก session — ใช้ในหน้าผู้ใช้หรือที่อื่นที่ต้องแสดง/scope ตาม context.
- **HOC:** หน้าที่ต้องเช็คสิทธิ์ใช้ `RequireAuth` (layout), `RequireGuest` (หน้า login), `RequirePermission(permission)` (เช่น หน้าผู้ใช้ใช้ `users:read`). Redirect logic ใช้ hook ร่วม `useAuthRedirect(redirectTo)`.
- **หมายเหตุ:** การแสดง/ซ่อน UI ตาม role/tier เป็นเพียง UX — ความปลอดภัยต้อง enforce ที่ backend เท่านั้น.
