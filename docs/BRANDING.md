# Branding & Design Tokens

โทนทางการ (Jira/Microsoft-style): สีน้ำเงินเป็นหลัก โทนเทาเย็น มุมโค้งพอประมาณ

---

## สี (CSS Variables ใน `app/globals.css`)

Primary โทนน้ำเงิน (แบบ Jira/Microsoft) — ค่าจริงอยู่ที่ `:root` ใน `app/globals.css`.

| Token | ค่า | ใช้กับ |
|-------|-----|--------|
| `--primary` (HSL) | 217 91% 40% | ปุ่ม CTA, ลิงก์สำคัญ, ไอคอน active (น้ำเงิน) |
| `--color-primary-hover` | #003d99 | Hover ปุ่มหลัก |
| `--color-primary-light` | #e8f0fe | พื้นหลังเมนู active, focus ring อ่อน |
| `--background` | 220 14% 97% | พื้นหลังหน้า (เทาเย็นอ่อน) |
| `--card` | 0 0% 100% | การ์ด/กล่องเนื้อหา (ขาว) |
| `--muted` | 220 14% 94% | พื้นหลังรอง, sidebar hover |
| `--color-success` | #16a34a | In Stock |
| `--color-warning` | #ca8a04 | Low Stock |
| `--color-danger` | #dc2626 | Out of Stock / ลบ |
| `--color-neutral-*` | #fafafa … #18181b | ขอบ, ข้อความรอง |

---

## โค้งขอบ (Radius)

| Token | ค่า | ใช้กับ |
|-------|-----|--------|
| `--radius` | 0.375rem (6px) | ปุ่ม, input (เป็นทางการ) |
| `--radius-lg` | 0.5rem (8px) | การ์ด, section |

---

## Components

- **btn-primary** — ปุ่ม CTA (สีน้ำเงิน, 6px radius)
- **btn-secondary** — ปุ่มรอง (ขอบเทา, พื้นขาว)
- **input-base** — ช่องค้นหา, ฟอร์ม (6px radius, focus ring น้ำเงิน)
- **card** — ตาราง, การ์ดตัวเลข (ขาว, ขอบเทาอ่อน, 8px radius)
- **Sidebar รายการ active** — เส้นซ้ายน้ำเงิน 3px + พื้นหลัง primary/10 (สไตล์ Jira/Microsoft)
- **StatusTag** — success / warning / danger ใน Inventory, Orders

---

## เปลี่ยนสีแบรนด์

แก้ใน `app/globals.css` ที่ `:root` และ `@theme` (--color-primary-hover, --color-primary-light) แล้วรัน build ใหม่
