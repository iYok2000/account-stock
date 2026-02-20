# Feature Spec — Orders (คำสั่งซื้อ)

สรุปฟีเจอร์จากโค้ด

---

## Route & Permission

- **Route:** `/[locale]/orders`
- **Permission:** `orders:read` (เห็นเมนู), `orders:create` (ปุ่มสร้างคำสั่งซื้อ)

---

## ฟีเจอร์หลัก (จากโค้ด)

### 1. Page Header
- หัวข้อ: title (i18n: `orders.title`)
- ปุ่ม **สร้างคำสั่งซื้อ (Place Order)** — แสดงเฉพาะเมื่อ `can("orders:create")`

### 2. Filter Bar
- **Search:** input type search
- **วันที่จาก:** input type date
- **วันที่ถึง:** input type date
- **Filter สถานะ:** select (filterStatus)
- ยังไม่ผูก state/API

### 3. ตารางคำสั่งซื้อ
- **คอลัมน์:** เลขที่ (colId), วันที่ (colDate), สถานะ (colStatus), ยอด (colAmount), (คอลัมน์ว่าง)
- **สถานะ:** StatusTag type order (pending, confirmed, shipped, delivered)
- Empty state: ข้อความจาก i18n `orders.empty`
- ปัจจุบันไม่มีปุ่มแก้ไข/ลบต่อแถว

### 4. Modal — สร้างคำสั่งซื้อ (FormModal)
- ชื่อ: placeOrderFormTitle
- เนื้อหา: ข้อความ mock "Form fields for order (mock) — ready for API"
- ปุ่ม: ยกเลิก, ยืนยัน (คลิกแล้วเปิด ConfirmModal)

### 5. Modal — ยืนยันส่ง order (ConfirmModal)
- ข้อความ: confirmSubmitOrder
- ปุ่มยืนยัน → mock submit (setTimeout + toast success)

---

## State (Client)

- `placeOrderOpen`, `confirmSubmitOpen`, `submitLoading`
- `orders` = [] (รอ API)

---

## ไฟล์ที่เกี่ยวข้อง

- `app/[locale]/orders/page.tsx` — หน้า (client, render OrdersContent)
- `components/orders/OrdersContent.tsx` — เนื้อหาทั้งหมด (client)
- `components/ui/StatusTag.tsx` — สถานะคำสั่งซื้อ
