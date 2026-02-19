# RBAC Specification — Inventory & Order Management

> Last updated: 2026-02-18  
> Status: **Active**

---

## 1. แนวคิดหลัก (Core Concepts)

Role-Based Access Control (RBAC) ควบคุมการเข้าถึงทรัพยากรโดยอิงจาก **Role** ของผู้ใช้ ไม่ใช่ตัวบุคคล

- **Resource** — สิ่งที่ถูกควบคุม (เช่น inventory, orders)
- **Action** — สิ่งที่ทำได้ (read, create, update, delete, export)
- **Permission** — คู่ `resource:action` (เช่น `inventory:update`)
- **Role** — กลุ่มของ permissions (Admin, Manager, Staff, Viewer)

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
| **Admin** | เข้าถึงได้ทุกอย่าง รวมถึงการจัดการระบบและ settings |
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
```

---

## 7. ความปลอดภัย (Security Notes)

- **Frontend enforcement** — ซ่อน/แสดง UI elements เท่านั้น ไม่ถือว่าปลอดภัย
- **Backend enforcement** — ต้องตรวจสอบ permission ทุก API endpoint
- **Token** — permissions ควร embed ใน JWT หรือ fetch จาก `/api/auth/me` และ cache ไว้
- **Audit log** — บันทึก `userId`, `resource`, `action`, `result` (allowed/denied), `timestamp`

---

## 8. Changelog

| วันที่ | การเปลี่ยนแปลง |
|---|---|
| 2026-02-18 | เพิ่ม resources: shops, promotions, analysis, agents, settings; อัพเดท role matrix; แก้ Viewer/Staff ไม่เห็น reports ผ่าน readOnly bug |
| Initial | สร้าง spec เบื้องต้น: dashboard, inventory, orders, suppliers, reports |
