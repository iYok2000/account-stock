# UX/UI Design — Inventory & Ordering Control

**สำหรับใคร:** AI agent ที่ช่วยเขียน/แก้ UI, designer ที่ออกแบบหรือปรับ layout  
**วิธีใช้:** อ่านเป็น brief + constraint — ทำตามหลักการและพฤติกรรมด้านล่าง ไม่ต้องมีโค้ดหรือ design-system-in-code ใน doc นี้

---

## ข้อกำหนดโปรเจกต์

| หัวข้อ | ค่า |
|--------|-----|
| งานแรก | เมนู + หน้า UI ทั้งชุด (ยังไม่มี API) |
| API | ยังไม่ต่อ — ไม่ใช้ mock data (แสดง empty state); ค่า token สีอ้างอิง BRANDING.md และ `app/globals.css` |
| อุปกรณ์ | รองรับ desktop / tablet / mobile (responsive) |
| Offline | ไม่ใช้ |
| Role | Role-based — รายละเอียดทีหลัง |
| ทีม | คนเดียว |
| Framework | React |
| หลายภาษา | รองรับ (i18n) |

---

## หลักการ UX/UI (ให้ AI และ designer ปฏิบัติตาม)

- **เมนูชัด** — ด้านบนหรือด้านข้าง แยก Inventory / Orders / Suppliers / Reports
- **Dashboard สรุป** — ตัวเลขสำคัญ (stock levels, pending orders) ดูได้ในหน้าเดียว
- **ค้นหา + filter** — ช่วยหา item หรือ order ได้เร็ว
- **ฟอร์ม + validation แบบ real-time** — แก้ก่อน submit
- **สถานะด้วยสี** — เขียว = In Stock, แดง/เหลือง = Low Stock, เทา = Out of Stock
- **Bulk actions** — เลือกหลายรายการแล้ว reorder / update
- **Responsive** — ใช้ได้ทั้ง desktop / tablet / mobile
- **Confirmation** — ยืนยันก่อนทำ action สำคัญ (ลบ, submit order ใหญ่)
- **CTA ชัด** — ปุ่ม Add Item / Place Order เด่น
- **Feedback** — loading, success, error แสดงชัด
- **Role** — ออกแบบ layout ให้มีพื้นที่สำหรับ role (เมนู/สิทธิ์แยกตาม role ได้ในภายหลัง)

---

## โครงเมนูหลัก (Sidebar Navigation)

### Header (ด้านบน, ติดบน viewport)
- ซ้าย: ปุ่ม Hamburger (แสดงเฉพาะเมื่อ sidebar ปิด)
- กลาง/ซ้าย: Logo/Brand
- ขวา: สลับภาษา (TH/EN), แสดง Role (placeholder)

### Sidebar
- **Desktop:** เปิดอยู่ default ความกว้างประมาณ 280px, ติดบน viewport (ไม่เว้นระยะจาก header). ปิดได้ด้วยปุ่มลูกศรซ้ายใน sidebar; เปิดกลับด้วย Hamburger ใน header (แสดงเมื่อ sidebar ปิดเท่านั้น).
- **Mobile:** ปิด default. เปิดเป็น overlay ทับ content พร้อม backdrop มืด; ปิดได้ด้วยปุ่ม X ใน sidebar หรือคลิก backdrop.
- **รายการเมนู (กลุ่ม):** (1) Dashboard, Inventory, Orders, Suppliers, Import, Shops (2) โปรโมชั่น: Campaigns, Vouchers, Fees (3) วิเคราะห์: Calculator, Tax, Funnels, Reports (4) เครื่องมือ: Agents, Settings. แต่ละรายการมี icon + label; แสดงตามสิทธิ์ (RBAC). ด้านล่าง sidebar มีตัวเลือกภาษาและ Role (placeholder).
- **รายการที่ active:** พื้นหลังสี primary, ตัวอักษรสีขาว, ตัวหนา, มี shadow เบา; เวลา hover เลื่อนไปทางขวาเล็กน้อย.

### ความหมายแต่ละหน้า
- **Dashboard** — Quick stats cards + overview (รอ API)
- **Inventory** — สินค้าในสต็อก, เพิ่ม/แก้ไข/ลบ, ค้นหา, filter, bulk actions
- **Orders** — รายการ order, สร้าง order, สถานะ, ค้นหา, filter
- **Suppliers** — รายชื่อ supplier (โครง, empty state)
- **Import** — Wizard นำเข้าข้อมูล (ประเภท → อัปโหลด → mapping)
- **Shops** — ช่องทางขาย (placeholder)
- **Campaigns / Vouchers / Fees** — โปรโมชั่น (placeholder)
- **Calculator** — เครื่องคำนวณกำไร (Sliders, Breakeven, Scenarios, Sensitivity, Monte Carlo)
- **Tax** — ภาษีบุคคลธรรมดา (bracket, ตัวเลขเสีย/ได้คืน)
- **Funnels / Reports** — วิเคราะห์ (placeholder)
- **Agents / Settings** — เครื่องมือ (placeholder)

---

## หน้าและพฤติกรรมหลัก

### 1. Dashboard (หน้าแรกหลังเข้าใช้)
- **Quick Stats Cards:** สินค้าทั้งหมด, Low Stock, Pending Orders, Orders วันนี้. แต่ละการ์ดมี icon สี (blue/amber/purple/green) + ตัวเลขใหญ่. Hover: ยกขึ้น + shadow + border เป็นสี primary. คลิกได้ → ไปหน้าที่เกี่ยวข้อง (Inventory / Orders).
- **Responsive:** desktop แสดง 4 การ์ดแนวนอน; tablet 2 คอลัมน์; mobile 1 คอลัมน์.

### 2. Inventory
- **List:** ตารางหรือการ์ด สินค้า (ชื่อ, SKU, จำนวน, สถานะสี, action).
- **Search ด้านบน + Filter** (สถานะ, หมวด).
- **Bulk actions:** เลือกหลายรายการ → Reorder / Export (ปุ่ม disable ก่อนมี API).
- **Add Item (CTA ชัด)** → ฟอร์มเพิ่มสินค้า + validation real-time.
- **แก้ไข/ลบ:** แก้ไข inline หรือ modal; ลบมี confirmation modal.
- **Status tags:** In Stock (เขียว), Low Stock (เหลือง), Out of Stock (แดง).

### 3. Orders
- **List:** ตาราง order (เลขที่, วันที่, สถานะ, ยอด, action).
- **Search + Filter** (วันที่, สถานะ).
- **Place Order (CTA)** → ฟอร์มสร้าง order + validation.
- **สถานะ:** Pending, Confirmed, Shipped, Delivered (สีต่างกัน).
- **Confirmation** ก่อน submit order ใหญ่.

### 4. Suppliers / Shops / Campaigns / Vouchers / Fees / Funnels / Reports / Agents / Settings
- หน้าพร้อมโครงหรือ placeholder (หัวข้อ + ข้อความ). เมนูและ layout พร้อมสำหรับต่อ API ทีหลัง.

### 5. Import
- Wizard: เลือกประเภท → อัปโหลดไฟล์ → mapping คอลัมน์ → result. ใช้ FileDropzone, ColumnMapper, DataPreview.

### 6. Calculator
- โหมด Simple/Advanced; Sliders (Pricing, Costs, Marketing, Returns); KPIs, Breakeven, Scenarios, Sensitivity; Monte Carlo (collapsible). Logic ใน `lib/calculator/engine.ts`.

### 7. Tax
- ภาษีบุคคลธรรมดา: bracket, slider รายได้, ตัวเลขเสีย/ได้คืน (แดง/เขียว), tips, export copy.

---

## องค์ประกอบ UI ที่ใช้ร่วมกัน (แนวทางสำหรับ designer / AI)

- **Layout:** Sidebar navigation (ย่อ/ขยายได้, ความกว้างประมาณ 280px) + พื้นที่ content. Header ติดบน; sidebar ติดบนเหมือนกัน (ไม่เว้นระยะจาก header). พื้นที่ content มีพื้นหลังอ่อน (neutral) เพื่อแยกจาก sidebar สีขาว.
- **Main content:** มีระยะห่างจาก header ลงมาสม่ำเสมอ (mobile เล็กกว่า desktop เล็กน้อย). ใช้ระยะเดียวกันทุกหน้า.
- **Dashboard Cards:** Icon สีต่างกันตามประเภท, ตัวเลขใหญ่ชัด, Hover: ยกขึ้น + shadow + border สี primary.
- **Buttons:** Primary สำหรับ CTA (สีน้ำเงิน), Secondary สำหรับ action รอง, Danger สำหรับลบ. Hover: สีเข้มขึ้น; กด: scale เล็กน้อย (รู้สึกกดได้).
- **Forms:** Focus ชัด (border สี primary + shadow เบา). Error แสดงใต้ฟิลด์แบบ real-time.
- **Tables/Lists:** Header มีพื้นหลังไล่โทนอ่อน; แถว hover มีพื้นหลังและ border เบา; มี checkbox สำหรับ bulk; เส้นคั่นแถวเป็นสี neutral อ่อน.
- **Modals:** ยืนยันการลบ / ยืนยัน submit. Overlay มืดพอให้โฟกัสที่ modal.
- **Toasts/Feedback:** success / error หลัง action (มุมล่างขวา). Loading แสดงตอน submit หรือโหลดรายการ.

---

## Layout & Spacing (สำหรับ AI / designer)

- **ระยะ Header → เนื้อหา:** เนื้อหาหลักเว้นจาก header ลงมาคงที่ทุกหน้า. ไม่ใช้ spacer element แยกระหว่าง header กับ sidebar เพราะจะทำให้ sidebar ไม่ชิด header.
- **ระยะระหว่างส่วนในหน้า:** หัวข้อหน้า, filter bar, ตาราง, การ์ด — ใช้ระยะห่างระหว่างส่วนเท่ากันทุกหน้า (เช่น 32px หรือ 40px). ใช้ gap ของ layout แทน margin ระหว่างบล็อกหลัก เพื่อไม่ให้ margin collapse และระยะคงที่.
- **หัวข้อหน้า (h1):** ไม่ใส่ margin ล่างแยก — ระยะจากหัวข้อถึงเนื้อหาถูกควบคุมโดย gap ของ layout.
- **Filter bar → ตาราง:** หน้าที่มี filter ด้านบนตาราง ให้ระยะระหว่าง filter กับตารางชัด (เช่น 40px) สม่ำเสมอ.
- **หน้าที่ใช้กฎนี้:** Dashboard, Inventory, Orders, Calculator, Tax, Import, Suppliers, Reports ฯลฯ — ทุกหน้าที่มีเนื้อหาภายในพื้นที่ main.

---

## Responsive

- **Desktop:** Sidebar เต็ม, ตารางหลายคอลัมน์.
- **Tablet:** เมนูย่อหรือ hamburger, ตาราง scroll แนวนอนถ้าจำเป็น.
- **Mobile:** Hamburger menu, list แบบการ์ด, ปุ่ม CTA อยู่ตำแหน่งนิ้วเอื้อม.

---

## หลายภาษา (i18n)

- เก็บ key ตามหน้า/ส่วน (เช่น inventory.title, orders.placeOrder).
- เมนู Lang สลับภาษาได้ทุกหน้า.
- วางโครงให้เพิ่มภาษาที่ 2, 3 ได้โดยไม่กระทบ layout.

---

## สรุปสำหรับ AI Agent และ Designer

- **Framework:** Next.js (React). ยังไม่ต่อ API — ไม่ใช้ mock data; list แสดง empty state.
- **Role:** ยังไม่ implement — มีเฉพาะ placeholder (User/Role ใน navbar).
- **ให้ทำ:** เมนู + หน้า UI + พฤติกรรมตามด้านบน + responsive + i18n.
- **Layout:** เนื้อหาทุกหน้าอยู่ใน wrapper เดียว ใช้ระยะห่างระหว่างส่วน (gap) คงที่; ระยะจาก header ถึง content คงที่; ไม่ใช้ spacer ระหว่าง header กับ sidebar.
- อ้างอิง DEV_SPEC และโครงไฟล์ใน repo สำหรับการ implement ต่อ. อ้างอิงเพิ่ม: [BRANDING.md](./BRANDING.md), สกิล `.cursor/skills/frontend-design/SKILL.md` (เมื่อปรับ typography, color, motion, spatial).

---

## สถานะการปรับปรุง (ที่ทำแล้ว)

| รายการ | สถานะ |
|--------|--------|
| Sidebar ความกว้าง ~280px | ✅ `w-[280px]` |
| รายการ active: พื้นหลัง primary + ตัวอักษรสีขาว + shadow | ✅ `bg-primary text-primary-foreground shadow-md`; hover เลื่อนขวา |
| Dashboard cards: Hover ยกขึ้น + shadow + border primary | ✅ `.card-hover:hover` ใช้ `border-primary`, `translateY(-2px)` |
| ระยะระหว่างส่วน (gap) | ✅ Dashboard `space-y-8`, grid `gap-8`; Inventory/Orders `gap-10` (~40px filter → ตาราง) |
| สีและ token ไปทางเดียวกัน | ✅ primary-hover/primary-light โทน warm; input focus ring `hsl(var(--primary)/0.2)` |
| Dashboard: stagger + จุดเด่น layout | ✅ KPI cards มี `dashboard-kpi-card` แบบ stagger; การ์ดแรก `lg:col-span-2` |
| ลด purple เป็นจุดเด่น | ✅ pendingOrders ใช้ blue; Quick action คำนวณกำไรใช้ primary/10 |
| พื้นหลัง content แยกจาก sidebar | ✅ main มี `bg-muted/20` |
| Toast มุมล่างขวา | ✅ ToastContext + `bottom-4 right-4` |
| Confirmation ก่อน action สำคัญ | ✅ modal ยืนยันลบ/ยืนยัน order |

---

## แนวทางเพิ่ม (จากสกิล frontend-design)

- **Typography:** ใช้ Sarabun รองรับไทย — ถ้าต้องการ “display” สำหรับหัวข้อใหญ่ อาจเพิ่ม font คู่
- **Color:** Primary โทน warm (น้ำตาล/ส้ม) — ค่าจริงใน `app/globals.css` (:root --primary) และ BRANDING.md; hover/focus ใช้โทนเดียวกัน
- **Motion:** stagger ตอนโหลดการ์ด; hover มี scale/shadow ชัด
- **Spatial:** เลือก 1–2 หน้าให้มีจุดเด่น (การ์ดใหญ่หรือ offset) เพื่อไม่ให้ดู template
- **Background:** sidebar/content แยกชั้นด้วยพื้นต่างโทน (content มี tint เบา)

---

## ทำได้ทีหลัง

- **Dark mode** — ใช้ semantic token ครบใน sidebar, card, input
- **Accessibility** — focus visible ทุก interactive; contrast ตาม WCAG
- **Responsive ละเอียด** — tablet breakpoint ตาราง/การ์ดไม่แคบ; CTA อยู่ตำแหน่งนิ้วเอื้อม
