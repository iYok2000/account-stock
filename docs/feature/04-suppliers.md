# Feature Spec — Suppliers (ผู้จัดส่ง)

สรุปฟีเจอร์จากโค้ด

---

## Route & Permission

- **Route:** `/[locale]/suppliers`
- **Permission:** `suppliers:read` (เห็นเมนู)

---

## ฟีเจอร์หลัก (จากโค้ด)

### 1. Page Header
- หัวข้อ: title (i18n: `suppliers.title`)

### 2. ตาราง
- **คอลัมน์:** ชื่อ (colName), ติดต่อ (colContact), Action (ว่าง)
- Empty state: ข้อความจาก i18n `suppliers.empty` (แถวเดียว colspan 3)
- ยังไม่มีปุ่มเพิ่ม/แก้ไข/ลบ ไม่มี filter

### 3. ข้อความเสริม
- ใต้ตาราง: placeholder (i18n: `suppliers.placeholder`) — "เตรียมสำหรับต่อ API ทีหลัง"

---

## สถานะปัจจุบัน

- หน้าโครงเท่านั้น (server component)
- ไม่มี form, modal, หรือ state — พร้อมสำหรับต่อ API

---

## ไฟล์ที่เกี่ยวข้อง

- `app/[locale]/suppliers/page.tsx` — หน้า (server component)
