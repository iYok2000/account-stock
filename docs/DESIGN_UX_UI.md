# UX/UI Design — Inventory & Ordering Control

จาก GPT research + ข้อกำหนดของคุณ

---

## ข้อกำหนดที่ใช้

| หัวข้อ | ค่า |
|--------|-----|
| งานแรก | เมนู + หน้า UI ทั้งชุด (ยังไม่มี API) |
| API | ยังไม่ต่อ — ไม่ใช้ mock data (แสดง empty state) |
| อุปกรณ์ | รองรับทั้ง desktop / tablet / mobile (responsive) |
| Offline | ไม่ใช้ |
| Role | Role-based — ระบุรายละเอียดทีหลัง |
| ทีม | คนเดียว |
| Framework | React |
| หลายภาษา | รองรับ (i18n) |

---

## พฤติกรรม UX/UI (ตาม research)

### หลักการ
- **เมนูชัด** — ด้านบนหรือด้านข้าง แยก Inventory / Orders / Suppliers / Reports
- **Dashboard สรุป** — ตัวเลขสำคัญ (stock levels, pending orders) ดูได้ในหน้าเดียว
- **ค้นหา + filter** — ช่วยหา item หรือ order ได้เร็ว
- **ฟอร์ม + validation แบบ real-time** — แก้ก่อน submit
- **สถานะด้วยสี** — เขียว = In Stock, แดง = Low Stock, เทา = Out of Stock
- **Bulk actions** — เลือกหลายรายการแล้ว reorder / update
- **Responsive** — ใช้ได้ทั้ง desktop / tablet / mobile
- **Confirmation** — ยืนยันก่อนทำ action สำคัญ (ลบ, submit order ใหญ่)
- **CTA ชัด** — ปุ่ม Add Item / Place Order เด่น
- **Feedback** — loading, success, error แสดงชัด

### Role (ระบุทีหลัง)
- ออกแบบ layout ให้มีพื้นที่สำหรับ role (เมนู/สิทธิ์แยกตาม role ได้ในภายหลัง)

---

## โครงเมนูหลัก (Sidebar Navigation)

**Header (ด้านบน, sticky top-0, z-30):**
```
[☰ Hamburger (แสดงเมื่อ sidebar ปิด)]  [Logo/Brand]  ...  [TH/EN]  [Role]
```

**Sidebar (Desktop: เปิด default, sticky top-0 | Mobile: ปิด default, overlay):**
```
[Brand]                      [× ปิด / ← ย่อ]
─────────────────────────────
🏠 Dashboard
📦 Inventory
📋 Orders
👥 Suppliers
📊 Reports
─────────────────────────────
[TH / EN]
Role: Admin (placeholder)
```

### พฤติกรรม Sidebar:
- **Desktop (≥768px):**
  - เปิดอยู่ default (280px width)
  - Sticky top-0, เริ่มจากบนสุดของ viewport (ไม่เว้นระยะจาก header)
  - ปิดได้ด้วยปุ่ม chevron-left (←) ใน sidebar
  - เปิดได้ด้วยปุ่ม hamburger (☰) ใน header (แสดงเมื่อ sidebar ปิดเท่านั้น)
  
- **Mobile (<768px):**
  - ปิดอยู่ default
  - เปิดเป็น overlay (fixed, z-50) ทับหน้าจอ + backdrop มืดด้านหลัง
  - ปิดได้ด้วยปุ่ม X ใน sidebar หรือคลิก backdrop

### เมนูแต่ละหน้า:
- **Dashboard** — Quick stats cards + overview
- **Inventory** — สินค้าในสต็อก, เพิ่ม/แก้ไข/ลบ, ค้นหา, filter, bulk actions
- **Orders** — รายการ order, สร้าง order, สถานะ, ค้นหา, filter
- **Suppliers** — รายชื่อ supplier (หน้าพร้อมโครง mock)
- **Reports** — สรุป/กราฟ (หน้าพร้อมโครง mock)
- **Lang (TH/EN)** — สลับภาษา (i18n) ทั้งใน header และ sidebar
- **Role** — placeholder สำหรับ role-based features ในอนาคต

---

## หน้าและพฤติกรรมหลัก

### 1. Dashboard (หน้าแรกหลังล็อกอิน/เข้าใช้)
- **Quick Stats Cards:** สินค้าทั้งหมด, Low Stock, Pending Orders, Orders วันนี้
  - แต่ละการ์ดมี icon สี (blue/amber/purple/green) + ตัวเลขใหญ่
  - Hover: ยกขึ้น + shadow + border เป็น primary
  - คลิกได้ → ไปหน้าที่เกี่ยวข้อง (Inventory / Orders)
- Responsive: desktop แสดง 4 การ์ดแนวนอน (grid 4 คอลัมน์), tablet 2 คอลัมน์, mobile 1 คอลัมน์

### 2. Inventory
- **List:** ตาราง/การ์ด สินค้า (ชื่อ, SKU, จำนวน, สถานะสี, action)
- **Search** ด้านบน + **Filter** (สถานะ, หมวด)
- **Bulk actions:** เลือกหลายรายการ → Reorder / Export (ปุ่ม disable ก่อนมี API)
- **Add Item** (CTA ชัด) → ฟอร์มเพิ่มสินค้า (mock) + validation real-time
- **แก้ไข/ลบ:** แก้ไข inline หรือ modal; ลบมี confirmation modal
- **Status tags:** In Stock (เขียว), Low Stock (เหลือง), Out of Stock (แดง)

### 3. Orders
- **List:** ตาราง order (เลขที่, วันที่, สถานะ, ยอด, action)
- **Search + Filter** (วันที่, สถานะ)
- **Place Order** (CTA) → ฟอร์มสร้าง order (mock) + validation
- **สถานะ:** Pending, Confirmed, Shipped, Delivered (สีต่างกัน)
- **Confirmation** ก่อน submit order ใหญ่

### 4. Suppliers
- หน้าพร้อมโครง (หัวข้อ + ข้อความ placeholder หรือ mock list)
- เมนูและ layout พร้อมสำหรับต่อ API ทีหลัง

### 5. Reports
- หน้าพร้อมโครง (placeholder หรือ mock กราฟ/ตัวเลข)
- เมนูและ layout พร้อมสำหรับต่อ API ทีหลัง

---

## องค์ประกอบ UI ที่ใช้ร่วมกัน

- **Layout:** Sidebar navigation (collapsible, 280px) + content area
  - **Header:** sticky top-0 z-30, สูง ~64-72px, แสดง hamburger เมื่อ sidebar ปิด
  - **Sidebar (Desktop):**
    - Sticky top-0 (เริ่มจากบนสุด viewport, ไม่เว้นระยะจาก header)
    - สูง h-screen (100vh)
    - เปิด default, collapsible ด้วยปุ่ม chevron-left (←)
    - Menu spacing: `gap-2` (8px), `px-4` container
    - Menu items: `gap-4` (icon-text 16px), `py-3.5` (height 14px), `text-[15px]`, `leading-tight`
  - **Sidebar (Mobile):**
    - Overlay fixed z-50, max-width 280px (85vw)
    - Backdrop: `bg-black/20`
    - ปิด default, เปิดได้ด้วย hamburger
  - **Main Content:**
    - `pt-8 md:pt-10` (32px/40px) เว้นจาก header
    - `bg-neutral-50`
  - **Active state (`.nav-active`):**
    - Background: `var(--color-primary)` (blue-600)
    - Color: white
    - Font: 600 (semibold)
    - Shadow: `0 1px 3px rgb(37 99 235 / 0.2)`
    - Hover: `transform: translateX(2px)` (เลื่อนขวา)
  - **Icon + label:** ทุกเมนู, gap 16px, font 15px
  - **Background:** solid white (professional, enterprise-grade)
  
- **Dashboard Cards:** Quick stats แบบ card
  - Icon สีต่างกัน (blue, amber, purple, green) ตามประเภท
  - ตัวเลขใหญ่ (3xl, bold, tabular-nums)
  - Hover: ยกขึ้น + shadow เพิ่ม + border เป็นสี primary
  
- **Buttons:** Primary (CTA สีน้ำเงิน), Secondary, Danger (ลบ)
  - Hover: สีเข้มขึ้น
  - Active: scale(0.98)
  
- **Forms:** Input, Select, DatePicker
  - Focus: border สี primary + shadow (light primary)
  - Error ใต้ฟิลด์ (real-time validation)
  
- **Tables/Lists:** 
  - Header: gradient (neutral-50 → neutral-100)
  - Row hover: light blue background + subtle border
  - Checkbox สำหรับ bulk selection
  - Border ระหว่างแถว: neutral-100
  
- **Modals:** ยืนยันการลบ / ยืนยัน submit
  - Overlay: black/50% opacity
  
- **Toasts/Feedback:** success / error หลัง action (มุมล่างขวา)

- **Loading:** ตัวโหลดตอนกด submit หรือโหลดรายการ

---

## Layout & Spacing Consistency (Page Container)

เพื่อให้ทุกหน้ามีระยะห่างและความรู้สึกเดียวกัน ใช้กฎนี้กับ **เนื้อหาภายใน `.page-container`** ทุกหน้า:

### กฎหลัก

1. **Header → Main Content Spacing:**
   - `<main>` ใช้ `pt-8 md:pt-10` (32px mobile / 40px desktop)
   - ระยะห่างนี้เว้นระหว่าง header (sticky top-0) กับ content ด้านล่าง
   - **ไม่ใช้ spacer element** (เช่น `<div className="h-6" />`) เพราะจะทำให้ sidebar มีช่องว่างจาก header

2. **Wrapper ระดับบนสุดของเนื้อหา** (div ที่ห่อทั้งหน้าภายใน `.page-container`) ใช้:
   - `className="flex flex-col gap-8"`
   - ระยะห่างระหว่างแต่ละส่วน (หัวข้อ, filter bar, ตาราง, การ์ด) จะเป็น **32px (gap-8)** เท่ากันทุกหน้า

3. **ไม่ใช้ margin ล่าง/บน** สำหรับจัดระยะระหว่างส่วนหลัก (เช่น หัวข้อกับ filter, filter กับ table) — ให้ใช้ **gap** ของ flex แทน เพื่อกัน margin collapse และให้ระยะคงที่

4. **หน้าที่ใช้กฎนี้:**
   - Dashboard — หัวข้อ + grid การ์ด
   - Inventory — หัวข้อ + ปุ่ม CTA | filter bar | bulk actions (ถ้ามี) | ตาราง
   - Orders — หัวข้อ + ปุ่ม CTA | filter bar | ตาราง
   - Suppliers — หัวข้อ | ตาราง | ข้อความเสริม
   - Reports — หัวข้อ | grid การ์ด

5. **หัวข้อหน้า (h1):** ไม่ใส่ `mb-6` / `mb-8` — ระยะห่างจากหัวข้อถึงเนื้อหาถูกควบคุมโดย `gap-8` แล้ว

6. **ถ้าต้องการระยะมากกว่า 32px** ในบางหน้า ให้ใช้ `gap-10` (40px) หรือ `gap-12` (48px) แทน `gap-8` แต่ควรใช้ค่าเดียวกันทั้งแอปเพื่อความสม่ำเสมอ

7. **ระยะ filter bar → table:** ใช้ class **`.content-table-wrapper`** (กำหนดใน `globals.css`) กับ div ที่เป็น card ห่อตาราง — class นี้ใส่ `margin-top: 2.5rem` (40px) เพื่อให้ระยะ filter/actions กับตารางชัดเจนเสมอ (ไม่พึ่งแค่ flex gap เฉยๆ). ใช้ใน Inventory และ Orders (หน้าที่มี filter bar ด้านบนตาราง).

### โครงสร้าง Layout ทั้งหมด

```tsx
// LayoutWithSidebar.tsx
<div className="flex min-h-screen flex-col">
  <Header sticky top-0 z-30 />
  <Sidebar mobile overlay />
  
  <div className="flex flex-1">
    <Sidebar desktop sticky top-0 h-screen />  {/* ไม่เว้นระยะจาก header */}
    
    <main className="flex-1 bg-neutral-50 pb-6 pt-8 md:pb-8 md:pt-10">
      <div className="page-container">
        {/* เนื้อหาของแต่ละหน้า */}
      </div>
    </main>
  </div>
</div>
```

### ตัวอย่างโครงหน้า

```tsx
// ภายใน page-container
return (
  <div className="flex flex-col gap-8">
    <h1 className="text-2xl font-semibold ...">{t("title")}</h1>
    {/* filter bar (ถ้ามี) — ไม่ต้อง mb- */}
    <div className="flex flex-wrap gap-2 md:gap-3">...</div>
    {/* ตาราง (หน้าที่มี filter ด้านบน) — ใช้ class content-table-wrapper เพื่อ margin-top 40px */}
    <div className="card content-table-wrapper ...">...</div>
  </div>
);
```

---

## Responsive

- **Desktop:** Sidebar หรือ top nav เต็ม, ตารางหลายคอลัมน์
- **Tablet:** เมนูย่อหรือ hamburger, ตาราง scroll แนวนอนถ้าจำเป็น
- **Mobile:** Hamburger menu, list แบบการ์ด, ปุ่ม CTA อยู่ตำแหน่งนิ้วเอื้อม

---

## หลายภาษา (i18n)

- ใช้ React i18n (เช่น react-i18next)
- เก็บ key ตามหน้า/ส่วน (เช่น `inventory.title`, `orders.placeOrder`)
- เมนู Lang สลับภาษาได้ทุกหน้า
- วางโครงให้เพิ่มภาษาที่ 2, 3 ได้ไม่กระทบ layout

---

## สรุปสำหรับ Dev

- ใช้ **Next.js** ตัวล่าสุด
- ยังไม่ต่อ API — **ไม่ใช้ mock data** (list แสดง empty state)
- Role ยังไม่ implement — มีเฉพาะ placeholder (User/Role ใน navbar)
- เน้น: เมนู + หน้า UI + พฤติกรรมตามด้านบน + responsive + i18n
- **Layout consistency:** เนื้อหาใน page-container ใช้ `flex flex-col gap-8` ที่ wrapper ระดับบนสุดทุกหน้า (ดูหัวข้อ "Layout & Spacing Consistency" ด้านบน)
- พร้อมสำหรับ "dev ต่อ" ตามเอกสาร DEV_SPEC และโครงไฟล์ใน repo
