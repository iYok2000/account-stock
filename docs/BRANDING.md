# Branding & Design Tokens

ตาม GPT research: CTA ชัด, สถานะสี, เรียบมืออาชีพ

---

## สี (CSS Variables ใน `app/globals.css`)

| Token | ค่า | ใช้กับ |
|-------|-----|--------|
| `--color-primary` | #2563eb | ปุ่ม CTA, ลิงก์สำคัญ |
| `--color-primary-hover` | #1d4ed8 | Hover ปุ่มหลัก |
| `--color-primary-light` | #dbeafe | Focus ring, ไฮไลต์ |
| `--color-success` | #16a34a | In Stock |
| `--color-warning` | #ca8a04 | Low Stock |
| `--color-danger` | #dc2626 | Out of Stock / ลบ |
| `--color-neutral-*` | #fafafa … #18181b | พื้นหลัง, ขอบ, ข้อความ |

---

## Components

- **btn-primary** — ปุ่ม CTA (Add Item, Place Order)
- **btn-secondary** — ปุ่มรอง (ยกเลิก, แก้ไข)
- **input-base** — ช่องค้นหา, filter, ฟอร์ม
- **card** — ตาราง, การ์ดตัวเลข
- **StatusTag** — เพิ่มเมื่อมีรายการสถานะ (success / warning / danger) ใน Inventory, Orders

---

## เปลี่ยนสีแบรนด์

แก้ใน `app/globals.css` ที่ `:root` แล้วรัน build ใหม่
