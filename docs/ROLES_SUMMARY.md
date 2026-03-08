# สรุป Role ทั้งหมด (RBAC)

> อ้างอิง: [RBAC_SPEC.md](./RBAC_SPEC.md), [SHOPS_AND_ROLES_SPEC.md](./SHOPS_AND_ROLES_SPEC.md), [lib/rbac/types.ts](../lib/rbac/types.ts), [lib/rbac/role-permissions.ts](../lib/rbac/role-permissions.ts)

---

## 1. รายการ Role (4 แบบ)

| Role        | ระดับ | ผูกกับร้าน | คำอธิบายสั้น |
|------------|--------|------------|----------------|
| **Root** | แพลตฟอร์ม | ไม่มี (shop_id = null) | Login ด้วย env + รหัสยืนยัน. **สร้างร้านค้า** + ใส่สมาชิก (อย่างน้อย 1 SuperAdmin) เท่านั้น |
| **SuperAdmin** | ระดับร้าน | 1 ร้าน | เห็นทั้งหมดของร้าน; จัดการชื่อร้าน; **จัดการสมาชิก** (เพิ่ม Admin/Affiliate) |
| **Admin** | ระดับร้าน | 1 ร้าน | เห็นและใช้งานทุกอย่างของร้าน ยกเว้นจัดการสมาชิกและแก้ชื่อร้าน |
| **Affiliate** | ระดับร้าน | 1 ร้าน | เห็นเฉพาะ **Dashboard** + **Import (Affiliate)** |

- **1 user : 1 shop** — email unique ทั้งระบบ.
- หลัง login: session มี `role` และ `shopId` (null เฉพาะ Root).

---

## 2. ลำดับชั้น (สรุป)

- **Root** — แยกออกมา (ไม่มี shop; เฉพาะสร้างร้าน).
- **Affiliate** ⊂ **Admin** ⊂ **SuperAdmin** (ในร้านเดียวกัน: แต่ละ role มี permissions ของ role ที่ต่ำกว่า + เพิ่มเติม).
- **Backend เป็น source of truth** — frontend ใช้สำหรับแสดง/ซ่อน UI เท่านั้น.

---

## 3. สิทธิ์ตาม Resource (สรุป)

| Resource   | Root | Affiliate | Admin | SuperAdmin |
|-----------|:----:|:---------:|:-----:|:----------:|
| shops (สร้างร้าน) | create | — | — | — |
| dashboard | — | read | read | read |
| inventory | — | read | all | all |
| shops (ร้านตัวเอง) | — | read | read | read + update |
| promotions | — | read | all | all |
| analysis | — | read | all | all |
| agents | — | — | all | all |
| settings | — | — | all | all |
| users (สมาชิกร้าน) | — | — | — | all |
| import (order) | — | — | create | create |
| import (affiliate) | — | create | create | create |

---

## 4. การใช้ในฟีเจอร์หลัก

| ฟีเจอร์ / หน้า | Permission ที่ใช้ | Role ที่เห็น (อย่างน้อย) |
|----------------|-------------------|---------------------------|
| สร้างร้านค้า | shops:create | **Root** เท่านั้น |
| Dashboard | dashboard:read | Affiliate, Admin, SuperAdmin |
| Inventory | inventory:read | Affiliate ขึ้นไป |
| **Import** | inventory:create / affiliate | Admin, SuperAdmin → Order Transaction + Affiliate; **Affiliate** → เฉพาะ Affiliate |
| จัดการร้าน / สมาชิก | users:read, shops:update | **SuperAdmin** เท่านั้น |
| Shops (ดูร้าน) | shops:read | Affiliate ขึ้นไป |
| Campaigns / Vouchers / Fees | promotions:read | Affiliate ขึ้นไป |
| Calculator, Tax, Reports | analysis:read | Affiliate ขึ้นไป |
| Settings | settings:read | Admin, SuperAdmin |

---

## 5. หมายเหตุ

- **Session** มี `role`, `shopId` (และ `shopName` ถ้า API ส่งมา). Root มี `shopId: null`.
- **Affiliate** ในโปรเจกต์นี้เห็นเฉพาะ Dashboard และ Import (ตัวเลือก Affiliate); Admin/SuperAdmin เห็น Order Transaction + Affiliate.
- ค่า role จาก session/API: `useUserContext()` คืน `role`, `roles`, `permissions`, `shopId` — ใช้ตรวจก่อนแสดงเมนูหรือตัวเลือก.
