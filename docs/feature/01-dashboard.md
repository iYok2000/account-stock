# Feature Spec — Dashboard

สรุปฟีเจอร์จากโค้ด (หน้าแรกหลัง login)

---

## Route & Permission

- **Route:** `/` (locale: `/th`, `/en`)
- **Permission:** `dashboard:read` (ต้องมีถึงจะเห็นเมนูและเข้าได้)

---

## ฟีเจอร์หลัก (จากโค้ด)

### 1. Page Header
- หัวข้อ: title + description (i18n: `dashboard.title`, `dashboard.description`)
- Badge: "Demo data — รอต่อ API" (ซ่อนบน mobile)

### 2. KPI Cards (4 การ์ด)
- **Grid:** 2 คอลัมน์ mobile, 4 คอลัมน์ desktop
- แต่ละการ์ด: icon, ค่า (value), เทรนด์ (%), label, trendLabel
- **ข้อมูล demo:** totalProducts, lowStock, pendingOrders, ordersToday
- คลิกการ์ด → ไป route ที่กำหนด (inventory, orders, reports)
- ใช้ `card card-hover` (คลิกได้)

### 3. รายรับ 7 วันล่าสุด (Chart)
- แสดงกราฟแท่ง (CSS bars) 7 วัน
- Hover แสดงยอด (K)
- สรุป: รวม 7 วัน, เฉลี่ย/วัน
- ข้อมูล demo: REVENUE_CHART

### 4. สต็อกใกล้หมด (Low Stock Alerts)
- รายการสินค้าที่ qty < min
- แสดง: ชื่อ, SKU, จำนวน (สีแดง)
- ลิงก์ "ดูทั้งหมด" → `/inventory`

### 5. คำสั่งซื้อล่าสุด (Recent Orders)
- ตารางย่อ: เลขที่, ลูกค้า, จำนวนรายการ, ยอด, สถานะ (PENDING/CONFIRMED/SHIPPED/DELIVERED)
- ลิงก์ "ดูทั้งหมด" → `/orders`

### 6. ทางลัด (Quick Actions)
- 4 ปุ่ม: เพิ่มสินค้า → `/inventory`, นำเข้าข้อมูล → `/import`, คำนวณกำไร → `/calculator`, ดูรายงาน → `/reports`

### 7. กิจกรรมล่าสุด (Mini Activity Feed)
- รายการข้อความกิจกรรมล่าสุด (hardcoded demo)

---

## Data (ปัจจุบัน)

- ใช้ constant ในหน้า (KPI_CARDS, REVENUE_CHART, LOW_STOCK_ITEMS, RECENT_ORDERS, QUICK_ACTIONS)
- ยังไม่ต่อ API — แทนที่ด้วย API เมื่อ backend พร้อม

---

## ไฟล์ที่เกี่ยวข้อง

- `app/[locale]/page.tsx` — หน้า Dashboard (server component)
