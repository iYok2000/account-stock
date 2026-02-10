# Dev Spec — Inventory & Ordering Control (Next.js)

เตรียมสำหรับ dev ต่อ: เมนู + หน้า UI ก่อน (ไม่ใช้ mock data — ใช้ empty state, ไม่ต่อ API)

---

## Tech Stack

| สิ่งที่ใช้ | ตัวเลือก |
|-----------|----------|
| Framework | **Next.js** (ตัวล่าสุด) |
| หลายภาษา | next-intl หรือ next-i18next |
| UI components | เลือกได้: MUI / Ant Design / Chakra UI (แนะนำ MUI หรือ Ant Design สำหรับตาราง+ฟอร์ม) |
| Data | ไม่ใช้ mock — หน้า list แสดง empty state จนกว่าจะต่อ API |

---

## โครงโฟลเดอร์แนะนำ (Next.js App Router)

```
account-stock-fe/
├── app/
│   ├── [locale]/           # i18n
│   │   ├── layout.tsx      # MainLayout
│   │   ├── page.tsx        # Dashboard /
│   │   ├── inventory/
│   │   │   ├── page.tsx
│   │   │   └── ...
│   │   ├── orders/
│   │   │   ├── page.tsx
│   │   │   └── ...
│   │   ├── suppliers/
│   │   │   └── page.tsx
│   │   └── reports/
│   │       └── page.tsx
│   ├── layout.tsx          # root layout
│   └── ...
├── components/
│   ├── common/
│   ├── layout/             # Header, Sidebar, MainLayout
│   └── ...
├── messages/               # i18n (th.json, en.json)
├── docs/
│   ├── DESIGN_UX_UI.md
│   └── DEV_SPEC.md
├── package.json
└── next.config.js
```

---

## เมนูและ Route

| เมนู | Path | หน้าที่ |
|------|------|--------|
| Dashboard | `/` | สรุปตัวเลข + ลิงก์ (empty state จนกว่าจะต่อ API) |
| Inventory | `/inventory` | รายการสินค้า + ค้นหา/filter + Add/Edit/Delete — แสดง empty state |
| Orders | `/orders` | รายการ order + Place Order — แสดง empty state |
| Suppliers | `/suppliers` | หน้า placeholder |
| Reports | `/reports` | หน้า placeholder |

---

## หน้าต่อหน้า (ไม่ใช้ mock data)

### Dashboard
- 4 การ์ดตัวเลข: สินค้าทั้งหมด, Low Stock, Pending Orders, Orders วันนี้ — แสดง 0 หรือ empty state
- ปุ่ม/ลิงก์ไป Inventory, Orders

### Inventory
- Toolbar: Search, Filter (สถานะ), ปุ่ม "Add Item"
- Table/Card: หัวคอลัมน์พร้อม — แสดง **empty state** (ยังไม่มีข้อมูล) จนกว่าจะต่อ API
- Bulk: checkbox + ปุ่ม Bulk actions (disable เมื่อไม่มีข้อมูล)
- Modal ฟอร์ม Add/Edit: ชื่อ, SKU, จำนวน, เกณฑ์ Low Stock — validation real-time (submit ยังไม่ส่งไปที่ไหน)
- Modal ยืนยันก่อนลบ

### Orders
- Toolbar: Search, Filter (วันที่, สถานะ), ปุ่ม "Place Order"
- Table: หัวคอลัมน์พร้อม — แสดง **empty state**
- Modal ฟอร์ม Place Order + validation (submit ยังไม่ส่ง)
- Modal ยืนยันก่อน submit

### Suppliers / Reports
- หน้าเดียว มีหัวข้อ + ข้อความ placeholder (ไม่มี mock list)

---

## Components ที่ควรมี

- **Layout:** MainLayout (Header + Nav + Content), Header, Sidebar หรือ TopNav
- **Common:** Button (primary/secondary/danger), Input, Select, Modal, Toast (StatusTag เพิ่มเมื่อมีข้อมูล)
- **Data:** DataTable (รองรับ sort, filter, checkbox), SearchBar, FilterBar
- **i18n:** ใช้ `useTranslation()` ในทุกข้อความที่แสดง

---

## i18n (Next.js)

- ใช้ `next-intl` หรือ `next-i18next` ตาม Next.js ตัวล่าสุด
- เก็บคำแปลใน `messages/th.json`, `messages/en.json`
- Key แนะนำ: `nav.inventory`, `nav.orders`, `inventory.addItem`, `orders.placeOrder`, `common.save`, `common.delete`, ฯลฯ
- ใน Header: dropdown สลับภาษา (th/en)

---

## Role (ทีหลัง)

- ใน Header มี placeholder "User" หรือ "Role" (dropdown ว่างหรือตัวเลือก mock)
- ไม่ต้องเช็คสิทธิ์ใน route ตอนนี้ — เตรียมโครงไว้

---

## ลำดับทำได้

1. สร้างโปรเจกต์ **Next.js** (ตัวล่าสุด) + i18n
2. Layout + เมนูหลัก + route ทุกหน้า (App Router)
3. Dashboard — การ์ดตัวเลข (ค่า 0 / empty state)
4. Inventory: โครงตาราง + toolbar + **empty state** + form Add/Edit + confirmation
5. Orders: โครงตาราง + toolbar + **empty state** + form Place Order + confirmation
6. Suppliers / Reports: หน้า placeholder
7. ปรับ responsive + สลับภาษา

**ไม่ใช้ mock data** — ทุก list แสดง empty state จนกว่าจะต่อ API

เสร็จแล้ว Cursor พร้อมให้ dev ต่อจากโครงและเอกสารนี้ได้เลย
