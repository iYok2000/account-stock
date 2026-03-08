# Feature Spec — Auth

API สำหรับ authentication และ current user context. สอดคล้อง SHOPS_AND_ROLES_SPEC และ RBAC (4 roles, shop-scoped).

---

## Routes

| Method | Path | Auth | Permission |
|--------|------|------|------------|
| POST | `/api/auth/login` | ไม่ต้องส่ง JWT | — |
| GET | `/api/auth/me` | Required (Bearer JWT) | — |

---

## POST /api/auth/login

**Request (application/json):** `{ "email", "password", "confirm_code?" }`

**Response (200):** `{ "token": "JWT string" }`

**Logic:** ถ้า email+password ตรง ROOT_EMAIL/ROOT_PASSWORD → ต้องส่ง confirm_code ตรง ROOT_CONFIRM_CODE → ออก JWT role=Root. ไม่เช่นนั้นหา user ใน DB, ตรวจ bcrypt → ออก JWT มี role, shop_id, shop_name.

**Error:** 401 — credentials ผิด หรือ confirm_code ไม่ตรง (Root)

---

## GET /api/auth/me

**Header:** `Authorization: Bearer <JWT>`

**Response (200):**

```json
{
  "user": { "id": "...", "displayName": "..." },
  "roles": ["Root"|"SuperAdmin"|"Admin"|"Affiliate"],
  "permissions": ["..."],
  "tier": "free",
  "company_id": "",
  "shop_id": "uuid or null",
  "shop_name": "optional"
}
```

**Error:** 401 — ไม่มี/ผิด token

---

## Env (Backend)

ROOT_EMAIL, ROOT_PASSWORD, ROOT_CONFIRM_CODE — server-side only.
