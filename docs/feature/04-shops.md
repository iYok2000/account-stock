# Feature Spec — Shops (ร้านค้า + สมาชิก)

API สำหรับสร้างร้านและจัดการสมาชิกร้าน. สอดคล้อง [SHOPS_AND_ROLES_SPEC](https://github.com/../account-stock-fe/docs/SHOPS_AND_ROLES_SPEC.md).

---

## Routes

| Method | Path | Auth | Permission | หมายเหตุ |
|--------|------|------|------------|----------|
| POST | `/api/shops` | Bearer JWT | `shops:create` (Root only) | สร้างร้าน + สมาชิก |
| GET | `/api/shops/me` | Bearer JWT | `users:read` | ชื่อร้าน + รายชื่อสมาชิก |
| PATCH | `/api/shops/me` | Bearer JWT | `users:read` | แก้ชื่อร้าน |
| POST | `/api/shops/me/members` | Bearer JWT | `users:create` | เพิ่มสมาชิก (Admin/Affiliate) |

---

## POST /api/shops

**ใครเรียกได้:** Root เท่านั้น (role จาก JWT = Root).

**Request (application/json)**

```json
{
  "name": "ชื่อร้าน",
  "members": [
    { "email": "...", "password": "...", "role": "SuperAdmin" },
    { "email": "...", "password": "...", "role": "Admin" }
  ]
}
```

- `members` อย่างน้อย 1 คน; อย่างน้อย 1 คนต้องมี `role: "SuperAdmin"`. Role ที่อนุญาต: SuperAdmin, Admin, Affiliate.
- Email ไม่ซ้ำทั้งระบบ (unique).

**Response (201 Created)**

```json
{
  "id": "shop uuid"
}
```

**Error**

- 400 — name ว่าง, ไม่มี member, ไม่มี SuperAdmin, email ซ้ำ
- 403 — ไม่ใช่ Root

---

## GET /api/shops/me

**ใครเรียกได้:** User ที่มี shop_id (SuperAdmin, Admin, Affiliate ของร้านนั้น). ใช้ permission `users:read` (SuperAdmin มี).

**Response (200 OK)**

```json
{
  "name": "ชื่อร้าน",
  "members": [
    { "id": "user uuid", "email": "...", "role": "SuperAdmin" }
  ]
}
```

**Error:** 403 — ไม่มี shop_id (เช่น Root) หรือไม่มีสิทธิ์

---

## PATCH /api/shops/me

**Request (application/json)**

```json
{
  "name": "ชื่อร้านใหม่"
}
```

**Response:** 200 OK (body ว่างหรือ ok)

**ใครเรียกได้:** User ที่มี shop_id และมีสิทธิ์ shops:update (SuperAdmin).

---

## POST /api/shops/me/members

**Request (application/json)**

```json
{
  "email": "...",
  "password": "...",
  "role": "Admin" | "Affiliate"
}
```

- ไม่ให้สร้าง SuperAdmin ผ่าน endpoint นี้ (SuperAdmin เกิดตอนสร้างร้านเท่านั้น).

**Response (201 Created)**

```json
{
  "id": "user uuid",
  "email": "...",
  "role": "Admin"
}
```

**ใครเรียกได้:** SuperAdmin ของร้านนั้น (permission `users:create`). สมาชิกใหม่ผูกกับ shop_id ของผู้เรียกอัตโนมัติ.

**Error:** 400 — email ซ้ำ; 403 — ไม่มีสิทธิ์

---

## Tenant scope

- ทุก endpoint ใช้ `shop_id` จาก JWT (auth context). ไม่รับ shop_id จาก body/query เป็น scope.
- POST /api/shops ไม่ใช้ tenant (Root ไม่มี shop_id); สร้าง shop ใหม่แล้วสร้าง users ผูก shop_id.

---

## Acceptance criteria

- [ ] POST /api/shops โดยไม่ใช่ Root → 403
- [ ] POST /api/shops โดย Root, body ถูกต้อง → 201, สร้าง shop + users ใน DB
- [ ] GET /api/shops/me โดย user ที่มี shop_id → 200, คืนชื่อร้าน + members
- [ ] PATCH /api/shops/me แก้ชื่อร้าน → 200
- [ ] POST /api/shops/me/members เพิ่มสมาชิก role Admin/Affiliate → 201; email ซ้ำ → 400
