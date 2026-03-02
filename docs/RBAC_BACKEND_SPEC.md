# RBAC Backend Specification — Inventory & Order Management

> Last updated: 2026-02-18  
> Status: **Active**  
> See also: [RBAC_SPEC.md](./RBAC_SPEC.md) for role matrix and core concepts.

---

## 1. Session Endpoint

### `GET /api/auth/me`

Returns current user's identity, roles, and resolved permissions.

**Response (200 OK)**

```json
{
  "user": {
    "id": "string (userId)",
    "displayName": "string (optional)"
  },
  "roles": ["SuperAdmin" | "Admin" | "Manager" | "Staff" | "Viewer"],
  "permissions": [
    "dashboard:read",
    "inventory:read",
    "inventory:create",
    "..."
  ]
}
```

**Error responses**

| Status | Meaning |
|---|---|
| 401 | ไม่ได้ login หรือ session หมดอายุ |
| 403 | Login แล้วแต่ไม่มีสิทธิ์เข้าถึงระบบ |

---

## 2. TypeScript Types (Frontend ↔ Backend contract)

```typescript
export type Role = "SuperAdmin" | "Admin" | "Manager" | "Staff" | "Viewer";

export type Resource =
  | "dashboard"
  | "inventory"
  | "orders"
  | "suppliers"
  | "shops"
  | "promotions"
  | "analysis"
  | "agents"
  | "settings"
  | "users";

export type Action = "read" | "create" | "update" | "delete" | "export";

export type PermissionString = `${Resource}:${Action}`;

export interface MeResponse {
  user: { id: string; displayName?: string };
  roles: Role[];
  permissions: PermissionString[];
}

export interface UserSession {
  userId: string;
  roles: Role[];
  permissions: PermissionString[];
  displayName?: string;
}
```

---

## 3. Permission Model

### 3.1 Resources

| Resource | ครอบคลุม route |
|---|---|
| `dashboard` | `/` |
| `inventory` | `/inventory`, `/import` |
| `orders` | `/orders` |
| `suppliers` | `/suppliers` |
| `shops` | `/shops` |
| `promotions` | `/campaigns`, `/vouchers`, `/fees` |
| `analysis` | `/calculator`, `/tax`, `/funnels`, `/reports` |
| `agents` | `/agents` |
| `settings` | `/settings` |
| `users` | `/users` (จัดการผู้ใช้ระบบ — SuperAdmin เท่านั้น) |

### 3.2 Actions

| Action | คำอธิบาย |
|---|---|
| `read` | GET / ดูข้อมูล |
| `create` | POST / สร้างใหม่ |
| `update` | PUT, PATCH / แก้ไข |
| `delete` | DELETE / ลบ |
| `export` | ส่งออก CSV, PDF |

### 3.3 Role–Permission Matrix

| Resource | Action | Viewer | Staff | Manager | Admin | SuperAdmin |
|---|---|:---:|:---:|:---:|:---:|:---:|
| dashboard | read | ✓ | ✓ | ✓ | ✓ | ✓ |
| inventory | read | ✓ | ✓ | ✓ | ✓ | ✓ |
| inventory | create/update/delete/export | — | ✓ | ✓ | ✓ | ✓ |
| orders | read | ✓ | ✓ | ✓ | ✓ | ✓ |
| orders | create/update/export | — | ✓ | ✓ | ✓ | ✓ |
| suppliers | read | ✓ | ✓ | ✓ | ✓ | ✓ |
| suppliers | create/update/delete | — | — | ✓ | ✓ | ✓ |
| shops | read | — | ✓ | ✓ | ✓ | ✓ |
| shops | create/update/delete | — | — | ✓ | ✓ | ✓ |
| promotions | read | — | ✓ | ✓ | ✓ | ✓ |
| promotions | create/update/delete/export | — | — | ✓ | ✓ | ✓ |
| analysis | read | — | ✓ | ✓ | ✓ | ✓ |
| analysis | export | — | — | ✓ | ✓ | ✓ |
| agents | read | — | — | ✓ | ✓ | ✓ |
| agents | create/update/delete | — | — | — | ✓ | ✓ |
| settings | read | — | — | ✓ | ✓ | ✓ |
| settings | update | — | — | — | ✓ | ✓ |
| users | read/create/update/delete/export | — | — | — | — | ✓ |

### 3.4 NAV Route → Required Permission

| Route | Required Permission | Minimum Role |
|---|---|---|
| `/` | `dashboard:read` | Viewer |
| `/inventory` | `inventory:read` | Viewer |
| `/import` | `inventory:create` | Staff |
| `/orders` | `orders:read` | Viewer |
| `/suppliers` | `suppliers:read` | Viewer |
| `/shops` | `shops:read` | Staff |
| `/campaigns` | `promotions:read` | Staff |
| `/vouchers` | `promotions:read` | Staff |
| `/fees` | `promotions:read` | Staff |
| `/calculator` | `analysis:read` | Staff |
| `/tax` | `analysis:read` | Staff |
| `/funnels` | `analysis:read` | Staff |
| `/reports` | `analysis:read` | Staff |
| `/agents` | `agents:read` | Manager |
| `/settings` | `settings:read` | Manager |
| `/users` | `users:read` | SuperAdmin |

---

## 4. Security Requirements

### 4.1 Backend Enforcement

- ทุก API endpoint ต้องตรวจสอบ permission ก่อนดำเนินการ
- Frontend permission check ใช้สำหรับ UI rendering เท่านั้น
- ห้ามใช้ role เปรียบเทียบโดยตรงในโค้ด ให้ใช้ permission string เสมอ

### 4.2 Token & Cache

- permissions ควร embed ใน JWT หรือ fetch จาก `/api/auth/me`
- Cache ได้บน client สูงสุด 5 นาที (TTL)
- เมื่อ role เปลี่ยน ต้อง invalidate session ทันที

### 4.3 Audit Logging

บันทึกทุก request ที่เกี่ยวกับ permission check:

```json
{
  "timestamp": "ISO8601",
  "userId": "string",
  "resource": "inventory",
  "action": "delete",
  "result": "allowed | denied",
  "ip": "string"
}
```

---

## 5. Performance Requirements

| Requirement | Target |
|---|---|
| `/api/auth/me` response time | < 200 ms (p95) |
| Permission check overhead | < 5 ms per request |
| Session cache TTL | 5 นาที |

---

## 6. Implementation Checklist

### Backend

- [ ] `GET /api/auth/me` คืนค่า `roles[]` + `permissions[]` ที่ถูกต้องตาม matrix
- [ ] Middleware ตรวจสอบ permission ทุก protected route
- [ ] ระบบ Audit logging ครบถ้วน
- [ ] Unit test ครอบคลุม permission matrix

### Frontend

- [ ] `AuthContext` fetch session จาก `/api/auth/me` แล้ว cache
- [ ] `usePermissions().can()` ใช้ตรวจสอบก่อน render UI
- [ ] `NAV_PERMISSIONS` map ถูกต้องตามตาราง Section 3.4
- [ ] Route guard redirect เมื่อไม่มี permission
- [ ] `ROLE_PERMISSIONS` (mock) สอดคล้องกับ matrix ข้างต้น

---

## 7. Changelog

| วันที่ | การเปลี่ยนแปลง |
|---|---|
| 2026-02-23 | เพิ่ม role SuperAdmin และ resource users; อัพเดท matrix และ NAV (รวม /users → users:read); สอดคล้อง RBAC_SPEC และ constants.ts |
| 2026-02-18 | เพิ่ม resources: shops, promotions, analysis, agents, settings; อัพเดท matrix, NAV mapping, TypeScript types; แก้ bug Staff ได้ reports:read |
| Initial | สร้าง spec เบื้องต้น: 5 resources (dashboard/inventory/orders/suppliers/reports) |
