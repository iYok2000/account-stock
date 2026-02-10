# RBAC Spec — สรุปจาก Research 2025–2026

สั้น ครอบคลุม สำหรับออกแบบ/implement ระบบ Role-Based Access Control ในโปรเจกต์ Inventory & Order

---

## 1. สิ่งที่ระบบต้องมี (Core)

| องค์ประกอบ | รายละเอียดสั้น |
|------------|-----------------|
| **Role** | กำหนดบทบาทตามหน้าที่ (เช่น Admin, Manager, Staff, Viewer). รองรับ role hierarchy (ลูกสืบทอดจากพ่อ). |
| **Permission** | ผูกกับ Role ไม่ผูก User โดยตรง. ละเอียดถึง resource + action (เช่น `inventory:read`, `orders:create`). |
| **User–Role** | User ถูก assign หลาย role ได้. รองรับ temporary/delegated role (มอบหมายชั่วคราว). |
| **Session** | แต่ละ session รู้ว่าใช้ role ไหน ได้สิทธิ์อะไร. รองรับหลาย role ใน session เดียว (ถ้าออกแบบ). |
| **Audit** | Log ครบ: ใคร ทำอะไร กับ resource ไหน เมื่อไหร่ ใช้ role อะไร. รองรับ access review / certification. |
| **Admin** | จัดการ role (สร้าง/แก้/ลบ/assign). รองรับ delegated admin และ workflow ขอ–อนุมัติ role. |
| **Integration** | ต่อ IdP/SSO, SCIM หรือ API สำหรับ sync user/role. |
| **Context (optional)** | ใช้ context เช่น เวลา/สถานที่/device หรือ hybrid RBAC+ABAC ถ้าต้องการ dynamic. |

---

## 2. แนวคิดสำคัญ (Principles)

- **Least Privilege** — ให้สิทธิ์น้อยที่สุดที่พอทำงานได้.
- **Role Hierarchy** — บทบาทลูกสืบทอดสิทธิ์จากบทบาทพ่อ.
- **Constraints** — จำกัดเมื่อไหร่/ที่ไหนใช้สิทธิ์ได้ (เวลา, สถานที่).
- **Separation of Duties (SoD)** — กันไม่ให้คนเดียวมี role ที่ขัดแย้งกัน (เช่น อนุมัติและเป็นคนขอ).
- **Attributes (optional)** — ใช้ attribute เช่น หน่วยงาน/โปรเจกต์ ร่วมกับ role เพื่อความละเอียด.

---

## 3. Auditing ที่ควรมี

- **Log ละเอียด:** ใคร เข้าถึงอะไร เมื่อไหร่ ผ่าน role ไหน.
- **Anomaly:** พฤติกรรมใช้ role/เข้าถึงผิดปกติ (ถ้ามี tool).
- **รายงาน:** รายงานสำหรับ audit และ compliance.
- **Access certification:** กระบวนการตรวจสอบเป็นระยะว่าใครควรมีสิทธิ์อะไร.

---

## 4. มาตรฐาน/แนวทางอ้างอิง

- NIST SP 800-162 (ABAC), ISO/IEC 27001/27002, Zero Trust, GDPR/HIPAA/SOX ตามที่องค์กรใช้.

---

## 5. Trade-offs ที่ต้องตัดสินใจ

- ความละเอียดของสิทธิ์ vs ความซับซ้อน.
- Static vs Dynamic roles.
- ความปลอดภัย vs ความสะดวก.
- รวมศูนย์ vs แบ่งส่วนการจัดการ (scale, delegate).

---

## 6. ตัวอย่างสำหรับโปรเจกต์นี้ (Inventory & Order)

- **Roles แนะนำ:** Admin, Manager, Staff, Viewer.
- **Resources:** inventory, orders, suppliers, reports, dashboard.
- **Actions:** read, create, update, delete, export (ตามความต้องการ).
- **Permission string:** `resource:action` (เช่น `inventory:update`, `orders:create`).
- เริ่มจาก coarse-grained (ต่อ resource หลัก) แล้วค่อยละเอียดถ้าจำเป็น.

---

---

## 7. Frontend implementation & Backend spec

- **Frontend:** ใช้ `lib/rbac`, `contexts/AuthContext`, `usePermissions()`; ซ่อน/แสดงเมนูและปุ่มตาม permission. ไม่ enforce สิทธิ์จริง — backend ต้องตรวจทุก request.
- **Backend:** อ่าน **`docs/RBAC_BACKEND_SPEC.md`** สำหรับ API สัญญา, โมเดลสิทธิ์, security, performance, และ audit.

*อ้างอิงจาก research RBAC best practices 2025–2026; ใช้เป็นแนวทางออกแบบและ implement.*
