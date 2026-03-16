# Inventory & Ordering Control — Frontend

เมนู + หน้า UI ก่อน (ไม่ใช้ mock — empty state, ไม่ต่อ API) · **Next.js** ตัวล่าสุด · i18n · Responsive · Role เตรียมไว้ทีหลัง

---

## เอกสาร

| ไฟล์ | เนื้อหา |
|------|--------|
| [docs/DESIGN_UX_UI.md](docs/DESIGN_UX_UI.md) | พฤติกรรม UX/UI, เมนู, หน้า, responsive, i18n |
| [docs/DEV_SPEC.md](docs/DEV_SPEC.md) | โครงโปรเจกต์, tech stack, โฟลเดอร์, components, ลำดับทำ |

---

## เตรียม Dev ต่อ

1. สร้างโปรเจกต์ **Next.js** (ตัวล่าสุด):  
   `npx create-next-app@latest .`
2. ติดตั้ง: i18n (next-intl หรือ next-i18next), UI library (MUI หรือ Ant Design)
3. ทำตามลำดับใน [docs/DEV_SPEC.md](docs/DEV_SPEC.md) — **ไม่ใช้ mock data** (empty state เท่านั้น)

---

## โครงเมนู

- **Dashboard** (`/`) — สรุปตัวเลข
- **Inventory** (`/inventory`) — รายการสินค้า, Add/Edit/Delete
- **Reports** (`/reports`) — placeholder
