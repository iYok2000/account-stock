# RBAC Specification — Inventory & Order Management

> Last updated: 2026-02-23  
> Status: **Active**

---

## 1. แนวคิดหลัก (Core Concepts)

Role-Based Access Control (RBAC) ควบคุมการเข้าถึงทรัพยากรโดยอิงจาก **Role** ของผู้ใช้ ไม่ใช่ตัวบุคคล

- **Resource** — สิ่งที่ถูกควบคุม (เช่น inventory, orders)
- **Action** — สิ่งที่ทำได้ (read, create, update, delete, export)
- **Permission** — คู่ `resource:action` (เช่น `inventory:update`)
- **Role** — กลุ่มของ permissions (SuperAdmin, Admin, Manager, Staff, Viewer)

**User context:** นอกเหนือจาก role แล้ว user อาจมี **tier** (free/paid) และ **company** (tenant) — ใช้สำหรับฟีเจอร์ที่แยกตามระดับบริการและหลายเจ้า; ดู [USER_SPEC.md](USER_SPEC.md)

---

## 2. หลักการ (Principles)

| หลักการ | คำอธิบาย |
|---|---|
| Least Privilege | ให้สิทธิ์เฉพาะที่จำเป็นต่อการทำงานเท่านั้น |
| Role Hierarchy | Manager มี permissions ของ Staff + เพิ่มเติม; Admin มีทั้งหมด |
| Deny by Default | ถ้าไม่มี permission ให้ denied เสมอ |
| Backend Enforcement | Frontend แสดงผล UI เท่านั้น; backend ต้องตรวจสอบทุก request |
| Audit Logging | บันทึกการเข้าถึง resource ทุกครั้ง |

---

## 3. Roles

| Role | คำอธิบาย |
|---|---|
| **SuperAdmin** | จัดการผู้ใช้ระบบ (users) — เห็นเมนู Users; ใช้สำหรับ dev/test login ผ่าน env |
| **Admin** | เข้าถึงได้ทุกอย่าง รวมถึงการจัดการระบบและ settings (ไม่รวม users) |
| **Manager** | บริหารจัดการ suppliers, shops, promotions, analysis; เข้าถึง settings และ agents (read-only) |
| **Staff** | ดำเนินการด้าน inventory/orders; เห็น shops, promotions, analysis (read-only) |
| **Viewer** | อ่านข้อมูลพื้นฐาน (dashboard, inventory, orders, suppliers) เท่านั้น |

---

## 4. Resources & Actions

### 4.1 Resources

| Resource | ครอบคลุม |
|---|---|
| `dashboard` | หน้าหลัก, สรุปภาพรวม |
| `inventory` | สินค้า, คลังสินค้า, นำเข้าสต็อก |
| `orders` | คำสั่งซื้อ |
| `suppliers` | ซัพพลายเออร์ |
| `shops` | ช่องทางขาย (sales channels) |
| `promotions` | แคมเปญ, คูปอง, ค่าธรรมเนียม |
| `analysis` | คำนวณต้นทุน, ภาษี, funnels, รายงาน |
| `agents` | AI assistant / automation |
| `settings` | ตั้งค่าระบบ (configuration) |
| `users` | จัดการผู้ใช้ระบบ — เฉพาะ SuperAdmin |

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

| Resource | Action | Viewer | Staff | Manager | Admin |
|---|---|:---:|:---:|:---:|:---:|
| dashboard | read | ✓ | ✓ | ✓ | ✓ |
| inventory | read | ✓ | ✓ | ✓ | ✓ |
| inventory | create | — | ✓ | ✓ | ✓ |
| inventory | update | — | ✓ | ✓ | ✓ |
| inventory | delete | — | ✓ | ✓ | ✓ |
| inventory | export | — | ✓ | ✓ | ✓ |
| orders | read | ✓ | ✓ | ✓ | ✓ |
| orders | create | — | ✓ | ✓ | ✓ |
| orders | update | — | ✓ | ✓ | ✓ |
| orders | export | — | ✓ | ✓ | ✓ |
| suppliers | read | ✓ | ✓ | ✓ | ✓ |
| suppliers | create | — | — | ✓ | ✓ |
| suppliers | update | — | — | ✓ | ✓ |
| suppliers | delete | — | — | ✓ | ✓ |
| shops | read | — | ✓ | ✓ | ✓ |
| shops | create | — | — | ✓ | ✓ |
| shops | update | — | — | ✓ | ✓ |
| shops | delete | — | — | ✓ | ✓ |
| promotions | read | — | ✓ | ✓ | ✓ |
| promotions | create | — | — | ✓ | ✓ |
| promotions | update | — | — | ✓ | ✓ |
| promotions | delete | — | — | ✓ | ✓ |
| promotions | export | — | — | ✓ | ✓ |
| analysis | read | — | ✓ | ✓ | ✓ |
| analysis | export | — | — | ✓ | ✓ |
| agents | read | — | — | ✓ | ✓ |
| agents | create | — | — | — | ✓ |
| agents | update | — | — | — | ✓ |
| agents | delete | — | — | — | ✓ |
| settings | read | — | — | ✓ | ✓ |
| settings | update | — | — | — | ✓ |

---

## 6. ตัวอย่าง Permission Strings

```
dashboard:read
inventory:create
inventory:export
orders:update
suppliers:read
shops:read
promotions:create
analysis:export
agents:read
settings:update
users:read      # เฉพาะ SuperAdmin
```

---

## 7. ความปลอดภัย (Security Notes)

- **Frontend enforcement** — ซ่อน/แสดง UI elements เท่านั้น ไม่ถือว่าปลอดภัย
- **Backend enforcement** — ต้องตรวจสอบ permission ทุก API endpoint; ใน multi-tenant ต้องเข้มงวด เพื่อป้องกันข้อมูลรั่วไหลข้าม tenant และสิทธิ์ผิดพลาด
- **Middleware / Interceptor** — ใช้ชั้นกลางสำหรับ (1) ดึง user context จาก token (2) ตรวจ permission ตาม resource:action (3) inject/ตรวจ `company_id` ให้ทุก query/upsert ถูก scope — ลดความซ้ำซ้อนและช่องโหว่
- **Token** — permissions (และ role, tier, company_id ถ้ามี) ควร embed ใน JWT หรือ fetch จาก `/api/auth/me`; อัปเดตให้ถูกต้องเพื่อให้ backend เช็คสิทธิ์ได้ทันทีและแม่นยำ
- **Tier** — ตรวจสอบสิทธิ์ tier ที่ backend เท่านั้น ไม่พึ่ง frontend
- **Audit log** — บันทึก `userId`, `resource`, `action`, `result` (allowed/denied), `timestamp`; พัฒนาให้ละเอียดและเก็บ log ให้มีประสิทธิภาพ เพื่อวิเคราะห์เหตุการณ์ผิดปกติในระบบ multi-tenant
- **Multi-tenant** — ข้อมูลที่แยกตามเจ้า ใช้ `company_id` จาก user context เป็น scope; ดู [USER_SPEC.md](USER_SPEC.md)

### 7.1 การทดสอบ (Testing)

- **Unit / Integration tests** — ทดสอบ enforcement สิทธิ์ (permission ตาม role) และ scope (`company_id`) ให้ครบถ้วน เช่น ทดสอบว่า request ที่ไม่มี permission ถูก deny, request ข้าม company ถูก deny

---

## 8. Frontend implementation (สรุป)

- **Nav:** `NAV_PERMISSIONS` map path → permission (เช่น `/users` → `users:read`); Sidebar/Command palette แสดงเมนู Users เฉพาะเมื่อมีสิทธิ์ `users:read`.
- **HOC:** `RequireAuth` (แสดงเนื้อหาเมื่อล็อกอิน หรืออยู่หน้า login), `RequireGuest` (แสดงเฉพาะเมื่อยังไม่ล็อกอิน), `RequirePermission(permission)` (แสดงเฉพาะเมื่อล็อกอินและมี permission นั้น). Redirect ใช้ hook ร่วม `useAuthRedirect(redirectTo)`.
- **หน้าผู้ใช้:** `/users` ห่อด้วย `RequirePermission("users:read")`; แสดง user context (role, tier, company) จาก `useUserContext()` และตารางรายการผู้ใช้ (รอ API).

---

## 9. Changelog

| วันที่ | การเปลี่ยนแปลง |
|---|---|
| 2026-02-23 | อัพเดท spec ตาม research: แยกหน้าที่ RBAC vs tier/company; Backend middleware/interceptor, tier ที่ backend, token อัปเดต; Audit log ละเอียด; §7.1 Testing (unit/integration สำหรับ permission + scope) |
| 2026-02-23 | Frontend: user context store (tier, companyId) ใน AuthContext; useUserContext; HOC RequirePermission + useAuthRedirect; หน้าผู้ใช้ใช้ users:read |
| 2026-02-23 | เพิ่ม role SuperAdmin และ resource users; เมนู Users เห็นเฉพาะ SuperAdmin; dev login ผ่าน env (NEXT_PUBLIC_TEST_USER / NEXT_PUBLIC_TEST_PASS) |
| 2026-02-18 | เพิ่ม resources: shops, promotions, analysis, agents, settings; อัพเดท role matrix; แก้ Viewer/Staff ไม่เห็น reports ผ่าน readOnly bug |
| Initial | สร้าง spec เบื้องต้น: dashboard, inventory, orders, suppliers, reports |
