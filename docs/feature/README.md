# Feature Specs — สรุปฟีเจอร์แต่ละเมนูจากโค้ด

เอกสารในโฟลเดอร์นี้สรุปฟีเจอร์ที่ **มีอยู่ในโค้ด** แต่ละหน้า (route) เพื่อใช้อ้างอิงตอนต่อ API หรือออกแบบต่อ

| ไฟล์ | หน้า | Route | หมายเหตุ |
|------|------|--------|----------|
| [01-dashboard.md](./01-dashboard.md) | Dashboard | `/` | KPI cards, chart 7 วัน, low stock, quick actions |
| [02-inventory.md](./02-inventory.md) | สินค้าคงคลัง | `/inventory` | ตาราง, filter, bulk actions, เพิ่ม/แก้/ลบ, RBAC |
| [05-reports.md](./05-reports.md) | รายงาน | `/reports` | โครงการ์ด 2 อัน, placeholder |
| [06-calculator.md](./06-calculator.md) | เครื่องคำนวณกำไร | `/calculator` | Sliders, ผลลัพธ์, Breakeven, Sensitivity, Scenarios, Monte Carlo |
| [07-import.md](./07-import.md) | นำเข้าข้อมูล | `/import` | Wizard: เลือกประเภท → อัปโหลด → mapping → result → บันทึกเข้า Inventory (SKU/วัน) |
| [08-tax.md](./08-tax.md) | ภาษี | `/tax` | ภาษีบุคคลธรรมดา: bracket, ตัวเลขเสีย/ได้คืน, tips, export |

เมนูอื่น (shops, campaigns, vouchers, fees, agents, settings) ยังไม่มี spec แยกในโฟลเดอร์นี้ — ถ้ามีหน้า/component ชัดเจนแล้วค่อยเพิ่มไฟล์ใหม่ได้
