# Prompt: ทำฟีเจอร์ Import Order Transaction แบบเดียวกันในโปรเจกต์อื่น

ใช้ prompt นี้เมื่อต้องการทำฟีเจอร์ **นำเข้ารายการขาย/คำสั่งซื้อ** ในอีกโปรเจกต์ โดยรูปแบบ CSV/XLSX อาจไม่ตรงกับของเรา — ระบบต้องรองรับ **column mapping** (จับคู่คอลัมน์ในไฟล์กับฟิลด์ในระบบอัตโนมัติ + ให้ user แก้ได้).

---

## Prompt ( copy ไปใช้กับ AI / dev )

```
ให้ทำฟีเจอร์ **Import Order Transaction** ตามนี้

### วัตถุประสงค์
ผู้ใช้อัปโหลดไฟล์ CSV หรือ XLSX ที่เป็นรายการขาย/คำสั่งซื้อ (แถวต่อบรรทัด = 1 รายการในออเดอร์) จากแหล่งใดก็ได้ (แพลตฟอร์มขาย, export เอง ฯลฯ). ระบบจะ:
1. ให้ user เลือก/ยืนยันการจับคู่คอลัมน์ในไฟล์กับ "ฟิลด์ในระบบ" (เพราะชื่อคอลัมน์แต่ละแหล่งไม่เหมือนกัน)
2. ทำความสะอาดและ parse ข้อมูล (trim, ตัวเลขว่าง→0, วันที่ให้เป็นรูปแบบเดียวกัน)
3. คำนวณสรุป: ยอดขายรวม, รายได้, การหัก (ส่วนลด/ค่าขนส่ง/ภาษี ฯลฯ), ยอดคืน
4. ตามระดับ (tier): **ฟรี** = สรุปรวม + สรุปตามวัน (daily); **เสียเงิน** = สรุปรวม + รายการแยกตาม SKU (1 สินค้า = 1 record)
5. ส่งผลลัพธ์เป็น JSON ไป API (ไม่เก็บไฟล์บน server)

### ข้อกำหนดสำคัญ

**1. รูปแบบไฟล์ไม่ตายตัว — ต้องมี Column Mapping**
- รับ CSV และ XLSX (หรือตามที่โปรเจกต์กำหนด).
- กำหนด "ฟิลด์ในระบบ" เป็นชุดคงที่ (เช่น order_id, sku_id, quantity, revenue_field, date_field, refund_field, ... ตามที่ใช้คำนวณจริง).
- แต่ละฟิลด์มี "คำพ้องความหมาย" (keywords) สำหรับจับคู่ชื่อคอลัมน์ในไฟล์: เช่น sku_id รองรับ "sku id", "sku_id", "รหัสสินค้า", "product id" ฯลฯ
- หลังอัปโหลด: **auto-detect** mapping จากชื่อ header (normalize: ตัวเล็ก, _ = ช่องว่าง, ลบช่องว่างซ้ำ; เทียบกับ keywords). แล้ว **ให้ user แก้ mapping ได้** (เลือกว่าคอลัมน์ไหนของไฟล์ map กับฟิลด์ไหนของระบบ).
- Validation: ฟิลด์ที่กำหนดว่า "จำเป็น" ต้องมี mapping และค่าต้องไม่ว่างในทุกแถว (ถึงค่อยกด Process ได้).

**2. ขีดจำกัดไฟล์**
- กำหนดขนาดสูงสุด (เช่น 3.5 MB) และจำนวนแถวสูงสุด (เช่น 50,000 แถว ไม่รวม header). ตรวจทั้งที่ dropzone และใน parser; แจ้ง error ชัดเจนถ้าเกิน.

**3. การคำนวณและ Tier**
- **ฟิลด์ที่ใช้คำนวณ:** ต้องมีอย่างน้อย order_id (หรือเทียบเท่า), sku_id (หรือเทียบเท่า), จำนวน, "รายได้ต่อแถว" (เช่น subtotal after discount), ฟิลด์หักต่างๆ (ส่วนลดแพลตฟอร์ม/ผู้ขาย, ค่าขนส่ง, ภาษี, ค่าธรรมเนียมเล็ก ฯลฯ), ยอดคืน, วันที่.
- **ค่าต่อ order (ค่าขนส่ง/ภาษี ฯลฯ):** มักเป็นต่อออเดอร์ ไม่ใช่ต่อบรรทัด. ให้แบ่งต่อแต่ละบรรทัด (SKU) ตาม **สัดส่วนรายได้** ของบรรทัดนั้นต่อยอดรวมรายได้ในออเดอร์เดียวกัน:  
  `ส่วนแบ่งของบรรทัด k = (ค่าขนส่ง+ภาษี+...) × (รายได้บรรทัด k / sum(รายได้ทุกบรรทัดในออเดอร์นั้น))`
- **Tier free:** คำนวณ summary (totalRows, totalRevenue, totalRefund, totalDeductions, dateFrom, dateTo) + array daily (แต่ละวัน: date, revenue, deductions_breakdown, refund, net).
- **Tier paid:** summary เดียวกัน + array items (แต่ละ SKU: sku_id, seller_sku?, product_name?, variation?, quantity, revenue, deductions, refund, net).

**4. Flow (Wizard)**
1. เลือกประเภทข้อมูล (Phase 1 อาจมีแค่ "Order Transaction" อย่างเดียว).
2. อัปโหลดไฟล์ → parse → auto-detect mapping → แสดง mapping + preview ข้อมูล (แก้ mapping ได้).
3. กด Process → คำนวณตาม tier ที่ user เลือก → ส่ง payload เป็น JSON ไป POST API (ไม่ส่งไฟล์).
4. แสดง Result (สำเร็จ/ข้อผิดพลาด; แสดงสรุปหรือตัวอย่างรายการตาม tier).

**5. ความปลอดภัย**
- กัน CSV injection: cell ที่ขึ้นต้นด้วย =, +, -, @ ฯลฯ ให้ prefix หรือ sanitize ตาม best practice (เช่น prefix ด้วย ').
- ไม่อัปโหลดไฟล์ขึ้น server เพื่อเก็บ — อ่านใน browser แล้ว aggregate แล้วส่งเฉพาะ JSON.

**6. Backend (สรุป)**
- POST รับ JSON มี `tier` + `summary` + `daily` (ถ้า free) หรือ `items` (ถ้า paid). Validate แล้ว upsert ตาม tenant/company_id และ date (และ sku_id ถ้า paid). ไม่รับไฟล์ ไม่ทำ aggregate ฝั่ง server.

### สิ่งที่โปรเจกต์ต้องกำหนดเอง (ให้ใส่ใน prompt หรือแยก config)
- **ชุดฟิลด์ในระบบ** (field id + label + required) ที่ใช้กับ Order Transaction ในโปรเจกต์นี้.
- **Keywords ต่อฟิลด์** — ชื่อหรือคำที่อาจปรากฏใน header ของไฟล์ (ภาษาไทย/อังกฤษ ตามที่ user น่าจะ export มา).
- **ขีดจำกัด:** max file size (bytes), max rows.
- **Route, permission, ชื่อ API endpoint** ตามโปรเจกต์.
- **รูปแบบวันที่** ที่รับ/ส่ง (เช่น ISO 8601 YYYY-MM-DD).
```

---

## วิธีใช้ในโปรเจกต์อื่น

1. **Copy บล็อก Prompt ด้านบน** ไปใส่ในแชทกับ AI หรือส่งให้ dev.
2. **เพิ่มข้อมูลของโปรเจกต์** ลงในส่วน "สิ่งที่โปรเจกต์ต้องกำหนดเอง" เช่น:
   - ตัวอย่างชื่อคอลัมน์จาก CSV/XLSX จริง (จาก Shopee, Lazada, หรือระบบอื่น) → ใช้เป็น keywords.
   - รายการฟิลด์ที่ต้องการ (ถ้าต้องการน้อยหรือมากกว่า 15 ฟิลด์ ก็ปรับ list + keywords).
   - ขนาดไฟล์/จำนวนแถวสูงสุด.
   - Route (เช่น `/import` หรือ `/sales/import`), permission (เช่น `sales:import`), endpoint (เช่น `POST /api/sales/import`).
3. ถ้ามี **ตัวอย่างไฟล์ CSV 1–2 แถว (พร้อม header)** ให้แนบหรือวางตัวอย่างไว้ใน prompt จะช่วยให้ AI สร้าง mapping + keywords ได้ตรงกับรูปแบบจริงมากขึ้น.
4. อ้างอิงโค้ดจากโปรเจกต์ account-stock-fe ได้ (file-parser, ImportWizard, ColumnMapper) เป็น reference implementation — แต่ให้ gen ใหม่ตาม stack และโครงโฟลเดอร์ของโปรเจกต์ปลายทาง.
