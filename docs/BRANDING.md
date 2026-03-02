# Branding & Design Tokens

ตาม GPT research: CTA ชัด, สถานะสี, เรียบมืออาชีพ

---

## สี (CSS Variables ใน `app/globals.css`)

Primary โทน warm (น้ำตาล/ส้ม) ตาม DESIGN_UX_UI — ค่าจริงอยู่ที่ `:root` ใน `app/globals.css`.

| Token | ค่า | ใช้กับ |
|-------|-----|--------|
| `--primary` (HSL) | 25 55% 38% | ปุ่ม CTA, ลิงก์สำคัญ (โทน warm) |
| `--color-primary-hover` | #6b4423 | Hover ปุ่มหลัก |
| `--color-primary-light` | #f5ebe0 | Focus ring, ไฮไลต์ |
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
