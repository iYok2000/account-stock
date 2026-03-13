# User Spec — User context (Shop-scoped Multi-Tenant)

ระบบออกแบบให้รองรับ **หลายร้าน (multi-tenant)** — user มี context ตาม [SHOPS_AND_ROLES_SPEC.md](SHOPS_AND_ROLES_SPEC.md)

---

## ความสัมพันธ์กับ RBAC

- **แยกหน้าที่ชัดเจน:** [RBAC_SPEC.md](RBAC_SPEC.md) จัดการ **สิทธิ์เข้าถึง** (resource:action ตาม role). **tier** และ **shop** จัดการ **ขีดความสามารถฟีเจอร์** และ **scope ข้อมูลตามร้าน** — ไม่อยู่ใน RBAC โดยตรง.
- **role** ใช้ตรวจสิทธิ์ (permission) ตาม RBAC — ค่าของ role เป็นไปตาม 4 roles: **Root**, **SuperAdmin**, **Admin**, **Affiliate** (ดู [SHOPS_AND_ROLES_SPEC.md](SHOPS_AND_ROLES_SPEC.md), [ROLES_SUMMARY.md](ROLES_SUMMARY.md)).
- **tier** และ **shop** เป็นส่วนเสริมของ user context สำหรับฟีเจอร์ที่แยกตามระดับบริการและตามร้าน.

---

## ฟิลด์ใน user context

| ฟิลด์ | ความหมาย | การใช้ |
|--------|-----------|--------|
| **role** | บทบาทตาม RBAC (Root, SuperAdmin, Admin, Affiliate) | ใช้ตรวจสิทธิ์ resource:action ตาม [RBAC_SPEC.md](RBAC_SPEC.md) |
| **tier** | ระดับบริการ (free / paid) | กำหนดขีดความสามารถของฟีเจอร์ (เช่น Import ฟรี vs paid) |
| **tierStartedAt** | วันที่เริ่มต้น tier ปัจจุบัน (ISO 8601) | แสดงใน UI settings/profile (optional) |
| **tierExpiresAt** | วันหมดอายุ tier (ISO 8601, null = unlimited) | แสดงใน UI settings/profile (optional) |
| **inviteCodeUsed** | Invite code ที่ใช้ล่าสุด | สำหรับ audit/display (optional) |
| **inviteSlots** | จำนวนเชิญที่เหลือ (default 0) | สำหรับ referral system (future) |
| **shopId** | ร้านที่ user สังกัด (null เฉพาะ Root) | **แยกข้อมูลต่อร้าน** — ข้อมูลที่แยกตามร้านต้อง scope ตาม shop_id ของ user ที่ล็อกอิน |
| **shopName** | ชื่อร้าน (optional จาก API) | แสดงใน UI |

- **1 user : 1 shop** — email unique ทั้งระบบ; Root มี shopId = null.

---

## Backend

- รับ request ต้องรู้ว่า request มาจาก user คนไหน (จาก token/session) → ได้ **user_id, role, tier, shop_id**, **shop_name** (optional).
- บันทึก/query ข้อมูลที่แยกตามร้าน ใช้ **shop_id** เป็น scope เสมอ (ไม่ให้ร้าน A เห็นข้อมูลร้าน B). Root ไม่มี shop_id — ใช้เฉพาะสร้างร้าน.
- **Enforcement ต้องเข้มงวด** โดยเฉพาะใน multi-tenant — ป้องกันข้อมูลรั่วไหลข้ามร้านและสิทธิ์ผิดพลาด.

### แนะนำการ implement

- **Middleware / Interceptor:** ใช้ชั้นกลางสำหรับ (1) ดึง user context จาก token/session (2) ตรวจสอบ permission ตาม RBAC (3) inject / ตรวจ **shop_id** ให้ทุก query/upsert ถูก scope — ลดความซ้ำซ้อนและช่องโหว่
- **Token:** อัปเดต permissions (และ role, tier, shop_id, shop_name) ใน JWT หรือ response `/api/auth/me` ให้ถูกต้อง เพื่อให้ backend เช็คสิทธิ์ได้ทันทีและแม่นยำ
- **Tier:** ตรวจสอบสิทธิ์ tier ที่ **backend เท่านั้น** — ไม่พึ่ง frontend (ไม่ปลอดภัย)

---

## Frontend

- ส่ง request ไป API พร้อม **Authorization: Bearer &lt;JWT&gt;** (token ได้จาก `POST /api/auth/login`).
- ไม่จำเป็นต้องส่ง shop_id ใน body — backend ดึงจาก user context.

### Implementation (store + HOC)

- **Store:** User context เก็บใน `AuthContext` (session state) — ฟิลด์ใน session: `userId`, `roles`, `permissions`, `displayName`, `tier`, `tierStartedAt`, `tierExpiresAt`, `inviteCodeUsed`, `inviteSlots`, `shopId`, `shopName`. API `/api/auth/me` คาด response มี `tier`, `tier_started_at`, `tier_expires_at`, `invite_code_used`, `invite_slots`, `shop_id`, `shop_name`; token เก็บใน api-client (setAuthToken) หลัง login.
- **Types:** `UserSession`, `UserTier` ("free" | "paid") ใน `lib/rbac/types.ts`; `MeResponse` รองรับ `tier`, `tier_started_at`, `tier_expires_at`, `invite_code_used`, `invite_slots`, `shop_id`, `shop_name`.
- **Hook:** `useUserContext()` คืนค่า `{ userId, role, roles, tier, tierStartedAt, tierExpiresAt, inviteCodeUsed, inviteSlots, shopId, shopName, displayName, permissions }` จาก session — ใช้ในหน้าหรือที่อื่นที่ต้องแสดง/scope ตาม context.
- **HOC:** หน้าที่ต้องเช็คสิทธิ์ใช้ `RequireAuth` (layout), `RequireGuest` (หน้า login), `RequirePermission(permission)` (เช่น หน้าสร้างร้านใช้ `shops:create`, หน้าสมาชิกร้านใช้ `users:read`, หน้า Admin/Invites ใช้ `invites:read`, หน้า Affiliate ใช้ `dashboard:read`). Redirect logic ใช้ hook ร่วม `useAuthRedirect(redirectTo)`.
- **หมายเหตุ:** การแสดง/ซ่อน UI ตาม role/shop เป็นเพียง UX — ความปลอดภัยต้อง enforce ที่ backend เท่านั้น.

---

## อ้างอิง

- **ร้านและบทบาท (สร้างร้าน, สมาชิก):** [SHOPS_AND_ROLES_SPEC.md](SHOPS_AND_ROLES_SPEC.md)
- **RBAC (role, permission matrix):** [RBAC_SPEC.md](RBAC_SPEC.md), [ROLES_SUMMARY.md](ROLES_SUMMARY.md)
