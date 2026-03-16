# Import (สรุปย่อ)

ใช้เป็น context prompt สั้น ไม่เปลือง token

## เส้นทาง
- หน้า FE: `/[locale]/import` (perm `inventory:create`)
- API Order Txn: `POST /api/inventory/import`
- API Affiliate: `POST /api/affiliate/import`

## ไฟล์ / การประมวลผล
- รองรับ CSV/XLSX, ขนาด ≤3.5MB, ≤50k rows
- parse/validate/mapping ใน browser เท่านั้น (ไม่อัปโหลดไฟล์)

## Order Transaction
- Payload FE → BE: `{ tier, items[] }`
- Backend upsert `import_sku_row` (key: shop_id + date + sku_id)
- tier free/paid ต่างกันเฉพาะการสรุปใน UI (ทั้งคู่ส่ง items)

## Affiliate Orders (UI โฟลว์)
- **จับคู่คอลัมน์:** ระบบจับคู่จาก header ในไฟล์อัตโนมัติ (ไม่ให้ user แก้ mapping เอง) — ใช้ขั้นนี้เพื่อดูตัวอย่างข้อมูลเท่านั้น
- **ฟิลด์ที่ต้อง map ได้ครบ:** Order ID, Product name, Shop name, Total final earned amount (ยอดสุทธิรายได้), Order settlement status
- **Process:** กด "Process" เพื่อประมวลผลฝั่ง client → แสดงผลสรุป (ยังไม่ยิง API)
- **บันทึก:** หลัง Process เสร็จ user กด "บันทึก" เอง เพื่อยิง API (POST /api/affiliate/import หรือตามที่ backend กำหนด)
- Payload FE → BE: `{ items: AffiliateImportItem[] }`
- Backend upsert `affiliate_sku_row` (key: company_id + user_id + order_id + sku_id)

## Dashboard แยกตามบทบาท
- Affiliate: overview/revenue7d/KPI ดึง `affiliate_sku_row`; low-stock ว่าง
- Owner/SuperAdmin/Admin/Root: ดึง `import_sku_row`

## ตารางที่ใช้
- `import_sku_row` : ข้อมูลขาย/สต็อกตามร้าน (seller roles)
- `affiliate_sku_row`: คอมมิชชัน affiliate (company_id+user_id scope)
- `import_results`: ลบแล้ว (ไม่ใช้)
