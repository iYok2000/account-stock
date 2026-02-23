# Feature Specs — สรุปฟีเจอร์แต่ละเมนูจากโค้ด

เอกสารในโฟลเดอร์นี้สรุปฟีเจอร์ที่ **มีอยู่ในโค้ด** แต่ละหน้า (route) เพื่อใช้อ้างอิงตอนต่อ API หรือออกแบบต่อ

| ไฟล์ | หน้า | Route | หมายเหตุ |
|------|------|--------|----------|
| [01-dashboard.md](./01-dashboard.md) | Dashboard | `/` | KPI cards, chart 7 วัน, low stock, recent orders, quick actions |
| [02-inventory.md](./02-inventory.md) | สินค้าคงคลัง | `/inventory` | ตาราง, filter, bulk actions, เพิ่ม/แก้/ลบ, RBAC |
| [03-orders.md](./03-orders.md) | คำสั่งซื้อ | `/orders` | ตาราง, filter, สร้างคำสั่งซื้อ, RBAC |
| [04-suppliers.md](./04-suppliers.md) | ผู้จัดส่ง | `/suppliers` | โครงตาราง, empty state |
| [05-reports.md](./05-reports.md) | รายงาน | `/reports` | โครงการ์ด 2 อัน, placeholder |
| [06-calculator.md](./06-calculator.md) | เครื่องคำนวณกำไร | `/calculator` | Sliders, ผลลัพธ์, Breakeven, Sensitivity, Scenarios, Monte Carlo |
| [07-import.md](./07-import.md) | นำเข้าข้อมูล | `/import` | Wizard: เลือกประเภท → อัปโหลด → mapping → result |
| [07-tax.md](./07-tax.md) | ภาษี | `/tax` | ภาษีบุคคลธรรมดา: bracket, ตัวเลขเสีย/ได้คืน, tips, export |

เมนูอื่น (shops, campaigns, vouchers, fees, funnels, agents, settings) ยังไม่มี spec แยกในโฟลเดอร์นี้ — ถ้ามีหน้า/component ชัดเจนแล้วค่อยเพิ่มไฟล์ใหม่ได้
