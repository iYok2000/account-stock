# Feature Spec — Reports (รายงาน)

สรุปฟีเจอร์จากโค้ด

---

## Route & Permission

- **Route:** `/[locale]/reports`
- **Permission:** `reports:read` (เห็นเมนู)

---

## ฟีเจอร์หลัก (จากโค้ด)

### 1. Page Header
- หัวข้อ: title (i18n: `reports.title`)

### 2. การ์ดรายงาน (Grid 2 คอลัมน์)
- **การ์ดที่ 1 — สรุปยอดขาย (salesSummary)**
  - หัวข้อจาก i18n
  - ตัวเลขใหญ่: 0 (placeholder)
  - ข้อความ: placeholder "เตรียมสำหรับต่อ API ทีหลัง"

- **การ์ดที่ 2 — สินค้าขายดี (topProducts)**
  - หัวข้อจาก i18n
  - ตัวเลขใหญ่: 0 (placeholder)
  - ข้อความ: placeholder

---

## สถานะปัจจุบัน

- หน้าโครงเท่านั้น (server component)
- ไม่มีกราฟ/ตารางจริง — พร้อมสำหรับต่อ API

---

## ไฟล์ที่เกี่ยวข้อง

- `app/[locale]/reports/page.tsx` — หน้า (server component)
