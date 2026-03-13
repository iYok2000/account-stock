# RBAC Backend Specification — Shops & Roles (FE ↔ BE Contract)

> Last updated: 2026-03-06  
> Status: **Active**  
> See also: [RBAC_SPEC.md](./RBAC_SPEC.md), [SHOPS_AND_ROLES_SPEC.md](./SHOPS_AND_ROLES_SPEC.md).

---

## 1. Auth Endpoints

### `POST /api/auth/login`

Login ด้วย email + password (+ confirm_code สำหรับ Root). คืน JWT.

**Request (application/json)**

```json
{
  "email": "string",
  "password": "string",
  "confirm_code": "string (optional — required when credentials match Root)"
}
```

**Response (200 OK)**

```json
{
  "token": "JWT string"
}
```

**Error:** 401 — credentials ไม่ถูกต้อง หรือ confirm_code ไม่ตรง (กรณี Root).

- **Root:** ตรวจจาก env `ROOT_EMAIL`, `ROOT_PASSWORD`, `ROOT_CONFIRM_CODE` (server-side). ผ่านแล้วออก JWT role=Root, ไม่มี shop_id.
- **อื่นๆ:** หา user จาก DB ตาม email, ตรวจ password (bcrypt), ออก JWT พร้อม role, shop_id, shop_name.

---

### `GET /api/auth/me`

Returns current user's identity, roles, permissions, and shop. ต้องส่ง `Authorization: Bearer <JWT>`.

**Response (200 OK)**

```json
{
  "user": { "id": "...", "displayName": "..." },
  "roles": ["Root" | "SuperAdmin" | "Admin" | "Affiliate"],
  "permissions": ["dashboard:read", "shops:create", "..."],
  "tier": "free",
  "tier_started_at": "ISO8601 or null",
  "tier_expires_at": "ISO8601 or null",
  "invite_code_used": "string or empty",
  "invite_slots": 0,
  "company_id": "",
  "shop_id": "uuid or null (null for Root)",
  "shop_name": "ชื่อร้าน (optional)"
}
```

**Error:** 401 — ไม่มี token / token หมดอายุ / token ไม่ถูกต้อง.

---

## 2. TypeScript Types (Frontend ↔ Backend contract)

```typescript
export type Role = "Root" | "SuperAdmin" | "Admin" | "Affiliate";

export interface MeResponse {
  user: { id: string; displayName?: string };
  roles: Role[];
  permissions: string[];
  tier?: string;
  tierStartedAt?: string | null;
  tierExpiresAt?: string | null;
  inviteCodeUsed?: string;
  inviteSlots?: number;
  company_id?: string;
  shop_id?: string | null;
  shop_name?: string;
}

export interface UserSession {
  userId: string;
  roles: Role[];
  permissions: string[];
  displayName?: string;
  tier?: string;
  tierStartedAt?: string | null;
  tierExpiresAt?: string | null;
  inviteCodeUsed?: string;
  inviteSlots?: number;
  shopId?: string | null;
  shopName?: string;
}
```

---

## 3. Shops API (Backend)

| Method | Path | Auth | Permission | หมายเหตุ |
|--------|------|------|------------|----------|
| POST | `/api/shops` | Bearer JWT | `shops:create` (Root only) | Body: `{ name, members: [{ email, password, role }] }` อย่างน้อย 1 SuperAdmin |
| GET | `/api/shops/me` | Bearer JWT | `users:read` | คืนชื่อร้าน + รายชื่อสมาชิก (SuperAdmin ของร้านนั้น) |
| PATCH | `/api/shops/me` | Bearer JWT | `shops:update` | Body: `{ name }` แก้ชื่อร้าน (SuperAdmin) |
| POST | `/api/shops/me/members` | Bearer JWT | `users:create` | Body: `{ email, password, role: "Admin" \| "Affiliate" }` (SuperAdmin) |

---

## 4. Role–Permission Matrix (Backend enforce)

| Role | สิทธิ์หลัก |
|------|------------|
| Root | `dashboard:read`, `shops:create`, `invites:*`, `config:*` |
| Affiliate | `dashboard:read`, `inventory:create` (Import affiliate), `analysis:read` |
| Admin | ครบทุก resource ยกเว้น `users:*`, `shops:update`, `invites:*`, `config:*` |
| SuperAdmin | ครบทุก resource รวม `users:*`, `shops:update`, `invites:*` (ไม่มี `config:*`) |

รายละเอียดเต็ม: [RBAC_SPEC.md](./RBAC_SPEC.md) §5, [ROLES_SUMMARY.md](./ROLES_SUMMARY.md).

---

## 5. NAV Route → Required Permission (Frontend)

| Route | Required Permission |
|-------|---------------------|
| `/` | `dashboard:read` |
| `/inventory` | `inventory:read` |
| `/import` | `inventory:create` |
| `/shops/create` | `shops:create` |
| `/shops/me` | `users:read` |
| `/campaigns`, `/vouchers`, `/fees` | `promotions:read` |
| `/calculator`, `/tax`, `/reports` | `analysis:read` |
| `/settings` | `settings:read` |
| `/users` | `users:read` |
| `/admin/invites` | `invites:read` |

---

## 6. Security

- ทุก API (ยกเว้น `/api/auth/login`, `/health`) ต้องตรวจ Bearer JWT และ permission ตาม role.
- Frontend เก็บ token หลัง login แล้วส่งใน header ทุก request; ไม่ส่ง credentials (root/test) ไป client ใน production — Root login ควรผ่าน backend (ส่ง confirm_code ไป POST /api/auth/login).
- Backend: ใช้ `shop_id` จาก JWT/context เป็น scope เท่านั้น — ไม่ใช้ค่าจาก body/query เป็น scope.

---

## 7. Changelog

| วันที่ | การเปลี่ยนแปลง |
|--------|------------------|
| 2026-03-14 | **Breaking:** §3 PATCH /shops/me → `shops:update` (เดิม `users:read`); §4 Root เพิ่ม `invites:*`, `config:*`; Admin ถอน `users:*`; SuperAdmin เพิ่ม `invites:*`; Affiliate เพิ่ม `analysis:read`; เพิ่ม invite/config API routes |
| 2026-02-23 | เพิ่ม role SuperAdmin และ resource users |
| 2026-02-18 | เพิ่ม resources: shops, promotions, analysis, agents, settings |
