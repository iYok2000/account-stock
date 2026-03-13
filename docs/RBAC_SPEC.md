# RBAC Specification — Inventory & Order Management

> Last updated: 2026-02-23  
> Status: **Active**

---

## 1. แนวคิดหลัก (Core Concepts)

Role-Based Access Control (RBAC) ควบคุมการเข้าถึงทรัพยากรโดยอิงจาก **Role** ของผู้ใช้ ไม่ใช่ตัวบุคคล

- **Resource** — สิ่งที่ถูกควบคุม (เช่น inventory, shops, promotions)
- **Action** — สิ่งที่ทำได้ (read, create, update, delete, export)
- **Permission** — คู่ `resource:action` (เช่น `inventory:update`)
- **Role** — กลุ่มของ permissions: **Root** (แพลตฟอร์ม), **SuperAdmin**, **Admin**, **Affiliate** (ทั้งสามหลังเป็นแบบ **shop-scoped** — ผูกกับร้านหนึ่งร้าน)

**User context:** User มี **role** และ **shop_id** (null เฉพาะ Root). 1 user : 1 shop; email unique ทั้งระบบ. ดู [SHOPS_AND_ROLES_SPEC.md](SHOPS_AND_ROLES_SPEC.md) และ [USER_SPEC.md](USER_SPEC.md)

---

## 2. หลักการ (Principles)

| หลักการ | คำอธิบาย |
|---|---|
| Least Privilege | ให้สิทธิ์เฉพาะที่จำเป็นต่อการทำงานเท่านั้น |
| Role Hierarchy | Admin มี permissions ของ Affiliate + เพิ่มเติม; SuperAdmin มีทั้งหมดของร้าน; Root เฉพาะสร้างร้าน |
| Deny by Default | ถ้าไม่มี permission ให้ denied เสมอ |
| Backend Enforcement | Frontend แสดงผล UI เท่านั้น; backend ต้องตรวจสอบทุก request |
| Audit Logging | บันทึกการเข้าถึง resource ทุกครั้ง |

---

## 3. Roles (4 แบบ — Root + shop-scoped 3 roles)

| Role | ระดับ | ผูกกับร้าน | คำอธิบาย |
|---|---|---|---|
| **Root** | แพลตฟอร์ม (มี 1 account) | ไม่มี (shop_id = null) | Login ด้วย email/password + รหัสยืนยัน (env). สร้างร้านค้า + ใส่สมาชิก (อย่างน้อย 1 SuperAdmin) เท่านั้น |
| **SuperAdmin** | ระดับร้าน | 1 ร้าน | เห็นทั้งหมดของร้าน; จัดการชื่อร้าน; จัดการสมาชิก (เพิ่ม Admin/Affiliate) |
| **Admin** | ระดับร้าน | 1 ร้าน | เห็นและใช้งานทุกอย่างของร้าน ยกเว้นจัดการสมาชิกและแก้ชื่อร้าน |
| **Affiliate** | ระดับร้าน | 1 ร้าน | เห็นเฉพาะ Dashboard + Import (Affiliate) |

---

## 4. Resources & Actions

### 4.1 Resources

| Resource | ครอบคลุม |
|---|---|
| `dashboard` | หน้าหลัก, สรุปภาพรวม |
| `inventory` | สินค้า, คลังสินค้า, นำเข้าสต็อก |
| `shops` | ช่องทางขาย (sales channels) |
| `promotions` | แคมเปญ, คูปอง, ค่าธรรมเนียม |
| `analysis` | คำนวณต้นทุน, ภาษี, รายงาน |
| `agents` | AI assistant / automation |
| `settings` | ตั้งค่าระบบ (configuration) |
| `users` | จัดการสมาชิกร้าน — เฉพาะ SuperAdmin ของร้านนั้น |
| `invites` | จัดการ invite codes และ tier — เฉพาะ Root/SuperAdmin |
| `config` | ตั้งค่าระบบทั้งหมด (system_config) — เฉพาะ Root |
| `shops:create` | สร้างร้านค้า (พร้อมสมาชิก) — เฉพาะ Root |

### 4.2 Actions

| Action | คำอธิบาย |
|---|---|
| `read` | ดูข้อมูล |
| `create` | สร้างรายการใหม่ |
| `update` | แก้ไขรายการที่มีอยู่ |
| `delete` | ลบรายการ |
| `export` | ส่งออกข้อมูล (CSV, PDF) |

---

## 5. Role–Permission Matrix

✓ = มี permission | — = ไม่มี permission  
(Root = แพลตฟอร์ม; SuperAdmin/Admin/Affiliate = ต่อร้าน, scope ด้วย shop_id)

| Resource | Action | Root | Affiliate | Admin | SuperAdmin |
|---|---|:---:|:---:|:---:|:---:|
| shops (platform) | create | ✓ | — | — | — |
| dashboard | read | ✓ | ✓ | ✓ | ✓ |
| inventory | read | — | — | ✓ | ✓ |
| inventory | create | — | — | ✓ | ✓ |
| inventory | update | — | — | ✓ | ✓ |
| inventory | delete | — | — | ✓ | ✓ |
| inventory | export | — | — | ✓ | ✓ |
| shops (own) | read | — | — | ✓ | ✓ |
| shops (own) | update | — | — | — | ✓ |
| promotions | read | — | — | ✓ | ✓ |
| promotions | create | — | — | ✓ | ✓ |
| promotions | update | — | — | ✓ | ✓ |
| promotions | delete | — | — | ✓ | ✓ |
| promotions | export | — | — | ✓ | ✓ |
| analysis | read | — | ✓ | ✓ | ✓ |
| analysis | export | — | — | ✓ | ✓ |
| agents | read | — | — | ✓ | ✓ |
| agents | create | — | — | ✓ | ✓ |
| agents | update | — | — | ✓ | ✓ |
| agents | delete | — | — | ✓ | ✓ |
| settings | read | — | — | ✓ | ✓ |
| settings | update | — | — | ✓ | ✓ |
| users (shop members) | read | — | — | — | ✓ |
| users (shop members) | create | — | — | — | ✓ |
| users (shop members) | update | — | — | — | ✓ |
| users (shop members) | delete | — | — | — | ✓ |
| invites | read | ✓ | — | — | ✓ |
| invites | create | ✓ | — | — | ✓ |
| invites | update | ✓ | — | — | ✓ |
| invites | delete | ✓ | — | — | ✓ |
| config | read | ✓ | — | — | — |
| config | update | ✓ | — | — | — |
| import (order) | create | — | — | ✓ | ✓ |
| import (affiliate) | create | — | ✓ | ✓ | ✓ |

---

## 6. ตัวอย่าง Permission Strings

```
dashboard:read
inventory:create
inventory:export
shops:read
promotions:create
analysis:export
agents:read
settings:update
users:read      # SuperAdmin ของร้าน (จัดการสมาชิก)
invites:read    # Root/SuperAdmin (จัดการ invite codes)
invites:create  # Root/SuperAdmin (สร้าง invite codes)
config:read     # Root เท่านั้น (อ่าน system config)
config:update   # Root เท่านั้น (แก้ system config)
shops:create    # Root เท่านั้น (สร้างร้าน)
```

---

## 7. ความปลอดภัย (Security Notes)

- **Frontend enforcement** — ซ่อน/แสดง UI elements เท่านั้น ไม่ถือว่าปลอดภัย
- **Backend enforcement** — ต้องตรวจสอบ permission ทุก API endpoint; ใน multi-tenant ต้องเข้มงวด เพื่อป้องกันข้อมูลรั่วไหลข้าม tenant และสิทธิ์ผิดพลาด
- **Middleware / Interceptor** — ใช้ชั้นกลางสำหรับ (1) ดึง user context จาก token (2) ตรวจ permission ตาม resource:action (3) inject/ตรวจ `shop_id` ให้ทุก query/upsert ถูก scope — ลดความซ้ำซ้อนและช่องโหว่
- **Token** — permissions (และ role, shop_id) ควร embed ใน JWT หรือ fetch จาก `/api/auth/me`; อัปเดตให้ถูกต้องเพื่อให้ backend เช็คสิทธิ์ได้ทันทีและแม่นยำ
- **Tier** — ตรวจสอบสิทธิ์ tier ที่ backend เท่านั้น ไม่พึ่ง frontend
- **Audit log** — บันทึก `userId`, `resource`, `action`, `result` (allowed/denied), `timestamp`; พัฒนาให้ละเอียดและเก็บ log ให้มีประสิทธิภาพ เพื่อวิเคราะห์เหตุการณ์ผิดปกติในระบบ multi-tenant
- **Multi-tenant** — ข้อมูลแยกตามร้าน ใช้ `shop_id` จาก user context เป็น scope; Root ไม่มี shop_id. ดู [SHOPS_AND_ROLES_SPEC.md](SHOPS_AND_ROLES_SPEC.md), [USER_SPEC.md](USER_SPEC.md)

### 7.1 การทดสอบ (Testing)

- **Unit / Integration tests** — ทดสอบ enforcement สิทธิ์ (permission ตาม role) และ scope (`shop_id`) ให้ครบถ้วน เช่น ทดสอบว่า request ที่ไม่มี permission ถูก deny, request ข้ามร้านถูก deny

---

## 8. Frontend implementation (สรุป)

- **Nav:** `NAV_PERMISSIONS` map path → permission:
  - `/shops/create` → `shops:create` (Root)
  - `/shops/me`, `/users` → `users:read` (SuperAdmin/Admin)
  - `/admin` → `users:read` (Root/SuperAdmin — admin hub)
  - `/admin/invites` → `invites:read` (Root/SuperAdmin)
- **Sidebar:** แสดงเมนูตาม NAV_PERMISSIONS:
  - **Root:** สร้างร้านค้า, Admin Hub, Invite Codes
  - **SuperAdmin/Admin:** จัดการร้าน/สมาชิก, Inventory, Import, Shops, Promotions, Analysis, Settings, Admin Hub, Invite Codes (SuperAdmin only)
  - **Affiliate:** Dashboard (main `/` — same page, role-adaptive content), Import (Affiliate), Analysis (calculator, tax, reports)
- **Dashboard merge:** `/affiliate` ถูกยุบเข้ากับหน้า `/` (main dashboard) — `DashboardContent` ปรับ content ตาม `role === "Affiliate"` อัตโนมัติ ไม่ต้องมีหน้าแยก
- **HOC:**
  - `RequireAuth` — แสดงเนื้อหาเมื่อล็อกอิน หรืออยู่หน้า login
  - `RequireGuest` — แสดงเฉพาะเมื่อยังไม่ล็อกอิน
  - `RequirePermission(permission)` — แสดงเฉพาะเมื่อล็อกอินและมี permission นั้น
  - Redirect logic: `useAuthRedirect(redirectTo)`
- **หน้าเครื่องมือ:**
  - **Admin Hub (`/admin`):** ห่อด้วย `RequirePermission("users:read")` (Root/SuperAdmin) — sections: Users, Shops, Invites, Settings, Platform Overview
  - **Invite Codes (`/admin/invites`):** ห่อด้วย `RequirePermission("invites:read")` (Root/SuperAdmin) — CRUD + toggle require_invite_code
  - **Users (`/users`):** ห่อด้วย `RequirePermission("users:read")` (SuperAdmin/Admin) — รายชื่อผู้ใช้

---

## 9. Changelog

| วันที่ | การเปลี่ยนแปลง |
|---|---|
| 2026-03-14 | **Breaking:** Root ได้ `dashboard:read` (เดิมไม่มี); Admin ถูกถอน `users:*` (เฉพาะ SuperAdmin จัดการสมาชิกได้); เพิ่ม `invites:*` + `config:*` permissions ใน matrix; อัปเดต §8 ตาม code จริง |
| 2026-03-13 | เพิ่ม resources: `invites` (Root/SuperAdmin), `config` (Root); เพิ่มหน้า `/admin` (Admin Hub), `/admin/invites` (Invite Codes), `/affiliate` (Affiliate Dashboard); อัปเดต NAV_PERMISSIONS และ Frontend implementation §8 |
| 2026-03-13 | เพิ่ม analysis:read (รวม tax) ให้ Affiliate; อัปเดต §8 คำอธิบาย Affiliate permissions |
| 2026-03-05 | อนุญาตให้ Admin มีสิทธิ์ settings:* เช่นเดียวกับ SuperAdmin (แต่ไม่มี users:*); ปรับเมนู Settings ให้ Admin/SuperAdmin เห็น; เอาเมนู Agents ออกจาก Sidebar/Command Palette (resource `agents` ยังมีไว้สำหรับอนาคต); FE layout guard ตรวจ NAV_PERMISSIONS แล้ว redirect ถ้าไม่มีสิทธิ์ |
| 2026-02-23 | **Breaking:** เปลี่ยนเป็น 4 roles — Root (platform), SuperAdmin, Admin, Affiliate (shop-scoped). 1 user : 1 shop; email unique. Root login ด้วย env + รหัสยืนยัน; สร้างร้าน (Root); จัดการสมาชิก (SuperAdmin). ดู [SHOPS_AND_ROLES_SPEC.md](SHOPS_AND_ROLES_SPEC.md) |
| 2026-02-23 | อัพเดท spec ตาม research: แยกหน้าที่ RBAC vs tier/company; Backend middleware/interceptor, tier ที่ backend, token อัปเดต; Audit log ละเอียด; §7.1 Testing (unit/integration สำหรับ permission + scope) |
| 2026-02-23 | Frontend: user context store (tier, companyId) ใน AuthContext; useUserContext; HOC RequirePermission + useAuthRedirect; หน้าผู้ใช้ใช้ users:read |
| 2026-02-23 | เพิ่ม role SuperAdmin และ resource users; เมนู Users เดิมเห็นเฉพาะ SuperAdmin |
| 2026-02-18 | เพิ่ม resources: shops, promotions, analysis, agents, settings; อัพเดท role matrix; แก้ Viewer/Staff ไม่เห็น reports ผ่าน readOnly bug |
| Initial | สร้าง spec เบื้องต้น: dashboard, inventory, reports |
