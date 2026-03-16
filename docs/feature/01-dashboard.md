# Feature Spec — Dashboard

สรุปฟีเจอร์และพฤติกรรม — หน้าแรกหลัง login  
**อ้างอิง:** DASHBOARD_SPEC (Congrats-seller), AFFILIATE_REDESIGN (narrative), DESIGN_UX_UI, DEV_SPEC

**Last Updated:** 2026-03-10  
**Status:** Implemented (Section A–D, DashboardSection, i18n)

---

## การเรียงลำดับการนำเสนอ = ลำดับเรื่องเล่า

ลำดับการแสดง section ตรงกับ narrative **ภาพรวม → ข่าวดี → เตือน → ทางลัด** (ห้ามสลับลำดับ)

| ลำดับ | Section | บทบาทใน narrative |
|-------|---------|---------------------|
| 1 | A. ภาพรวม | ภาพรวม |
| 2 | B. นำเข้าข้อมูล | ข่าวดี/เชิงบวก |
| 3 | C. รายรับและสต็อก | ข่าวดี (รายรับ) แล้ว เตือน (สต็อกใกล้หมด) — ภายใน section เรียงดีก่อนเตือน |
| 4 | D. ทางลัดและกิจกรรม | ทางลัด/แอคชัน |

---

## Route & Permission

- **Route:** `/` (locale: `/th`, `/en`)
- **Permission:** `dashboard:read` (ต้องมีถึงจะเห็นเมนูและเข้าได้)

## KPI Cards (Seller Dashboard — 4 ใบหลัก)

| ใบ | ฟิลด์ | คำอธิบาย |
|----|-------|-----------|
| 1 | `totalRevenue` | ยอดขายรวม; subtitle แสดง `totalOrders` |
| 2 | `totalDiscount` | ส่วนลดรวม; ถ้า `discountRate > 30%` แสดง badge สี danger |
| 3 | `netProfit` | กำไรโดยประมาณ (ไม่รวมต้นทุนสินค้า) — แสดง tooltip asterisk “ไม่รวมต้นทุน” |
| 4 | `aov` | มูลค่าต่อออเดอร์ (Average Order Value); subtitle “per order” |

ตัวอย่างแสดงผล: `฿925,474 | -฿486,417 | ฿439,057 | ฿327` และ subtitle `2,829 orders | 52.5% of rev | 47.5% margin | per order`.

### สิ่งที่ไม่ใช่ KPI การ์ด
- `orders/pending` ไม่อยู่ใน KPI cards ฝั่ง Seller — เป็นส่วนของ **Operations** (Section E) ผ่าน OrderFunnelChart (สถานะ: DELIVERED, CANCELLED, SHIPPED, PENDING, RETURNED ตามสีใน DASHBOARD_UX_DESIGN)
- ฝั่ง Affiliate: `pendingCount/pendingEstAmount` หมายถึงออเดอร์รอ settlement (ยังไม่ได้รับค่าคอม) แสดงเป็น status bar tier3: settled | pending (amber) | ineligible. ไม่ใช่ KPI หลักของ Seller.

---

## Narrative & Section Order

ลำดับการเล่าเรื่อง: **ภาพรวม → ข่าวดี → เตือน → ทางลัด/กิจกรรม**

| ลำดับ | Section ID | ชื่อ (i18n) | เนื้อหา | Collapsible | Default Open (Mobile / Tablet / Desktop) |
|-------|------------|-------------|---------|-------------|------------------------------------------|
| A | overview | ภาพรวม | KPI cards เท่านั้น | ไม่ยุบ (always visible) | — |
| B | import-insights | นำเข้าข้อมูล | ImportInsights (Admin/SuperAdmin เท่านั้น) | ใช่ | ปิด / เปิด / เปิด |
| C | revenue-stock | รายรับและสต็อก | รายรับ 7 วัน + สต็อกใกล้หมด | ใช่ | ปิด / ปิด / ปิด |
| D | shortcuts-activity | ทางลัดและกิจกรรม | Quick actions + Mini activity feed | ใช่ | ปิด / ปิด / ปิด |

- **Section A (ภาพรวม):** ไม่มีปุ่มยุบ/ขยาย แสดงตลอด
- **Section B–D:** ใช้ component `DashboardSection` — จำสถานะเปิด/ปิดใน localStorage

---

## DashboardSection Component

ใช้สำหรับ section ที่ยุบ/ขยายได้ (B, C, D)

### API

| Prop | Type | Required | คำอธิบาย |
|------|------|----------|----------|
| `id` | string | ใช่ | ค่าเดียวกับ Section ID (ใช้กับ localStorage + scroll anchor) |
| `title` | string | ใช่ | หัวข้อ section (i18n) |
| `description` | string | ไม่ | คำอธิบายใต้หัวข้อ (เมื่อขยาย) |
| `icon` | ReactNode | ไม่ | ไอคอนด้านซ้ายหัวข้อ |
| `defaultOpen` | boolean | ไม่ | ค่าเริ่มต้น (ถูก override โดย localStorage ถ้ามี) |
| `summary` | string | ไม่ | ข้อความย่อเมื่อยุบ (แสดงทางขวา) |
| `warningBadge` | string | ไม่ | badge เตือน (เช่น "24% ยกเลิก") |
| `chartCount` | number | ไม่ | จำนวน "บล็อก/กราฟ" ภายใน (แสดงเป็น badge "N รายการ") |
| `children` | ReactNode | ใช่ | เนื้อหาใน section |
| `className` | string | ไม่ | class เพิ่มเติม |

### พฤติกรรม

- **Header:** ปุ่มเต็มความกว้าง (min-height 44px), ซ้าย: icon + title, ขวา: summary (เมื่อยุบ) + warningBadge + chartCount badge + chevron
- **สถานะ:** เปิด = chevron ลง, พื้นหลัง `bg-muted/40`; ปิด = chevron ขวา, พื้นหลัง `bg-card`
- **Animation:** 300ms expand/collapse (max-height + opacity)
- **localStorage key:** `dashboard-section-{id}-expanded` (boolean string)
- **Accessibility:** `aria-expanded`, `aria-controls`, `aria-labelledby`; แป้น Tab/Enter/Space ใช้ได้

### Responsive Default (เมื่อไม่มีค่าใน localStorage)

- **Mobile (< 768px):** B, C, D ปิด (ถ้าต้องการแยกตาม viewport ต้อง set defaultOpen ใน client ตาม breakpoint)
- **Tablet (768px–1023px):** B เปิด, C, D ปิด
- **Desktop (≥ 1024px):** B เปิด, C, D ปิด

**หมายเหตุ (implementation ปัจจุบัน):** ส่ง `defaultOpen` เป็นค่าคงที่ต่อ section (B=true, C=D=false) ไม่ได้อ่าน breakpoint — ดังนั้นครั้งแรกที่เข้า B จะเปิดทุก viewport; หลังนั้นใช้ค่าจาก localStorage

### Design Tokens (account-stock-fe)

- ใช้ semantic tokens จาก `globals.css`: `card`, `border`, `primary`, `muted-foreground`, `foreground`
- ไม่ใช้ brown palette; ใช้ primary (blue) และ neutral ตาม DESIGN_UX_UI

---

## ฟีเจอร์หลัก (รายละเอียด)

### 1. Page Header
- หัวข้อ: title + description (i18n: `dashboard.title`, `dashboard.description`)
- Badge: "รอต่อ API" (ซ่อนบน mobile) — ใช้เมื่อยังไม่ต่อ API

### 2. Section A: ภาพรวม (KPI Cards)
- **ไม่ใช้ DashboardSection** — แสดงเป็นบล็อกคงที่
- Grid: 2 คอลัมน์ mobile, 4 คอลัมน์ desktop
- การ์ด: icon, ค่า (value), label (i18n)
- **ข้อมูล:** ไม่ใช้ mock — แสดง "—" หรือ empty state จนกว่าต่อ API
- คลิกการ์ด → ไป route ที่กำหนด (inventory, reports)
- ใช้ `card card-hover`; touch target ≥ 44px

### 3. Section B: นำเข้าข้อมูล (Import Insights)
- ใช้ `DashboardSection` id=`import-insights`, `defaultOpen={true}`
- เนื้อหา: component `ImportInsights` (แสดงเฉพาะ Admin/SuperAdmin; return null ถ้าไม่ใช่)
- summary เมื่อยุบ: ใช้ `dashboard.importInsights.subtitle` (i18n)
- icon: `BarChart3`

### 4. Section C: รายรับและสต็อก
- ใช้ `DashboardSection` id=`revenue-stock`
- **ลำดับภายใน section (บังคับ):** รายรับ (เชิงบวก) ก่อน → สต็อกใกล้หมด (เตือน) หลัง — ตามหลัก narrative ดีก่อนเตือน
- เนื้อหา:
  - **รายรับ 7 วันล่าสุด:** กราฟแท่ง 7 วัน, hover แสดงยอด, สรุปรวม/เฉลี่ย — ไม่ใช้ mock (แสดง placeholder/empty จนต่อ API)
  - **สต็อกใกล้หมด:** รายการ qty < min, ชื่อ/SKU/จำนวน, ลิงก์ "ดูทั้งหมด" → `/inventory` (แสดงเฉพาะ role ที่มีสิทธิ์ `inventory:read`) — empty state จนต่อ API
- Layout ภายใน: grid 2 col บน desktop (chart 2/3, low stock 1/3) หรือ stacked บน mobile; ไม่อนุญาตสลับบล็อก (รายรับต้องมาก่อน)

### 5. Section D: ทางลัดและกิจกรรม
- ใช้ `DashboardSection` id=`shortcuts-activity`
- เนื้อหา:
  - **ทางลัด:** ปุ่มไปยังหน้าหลัก เช่น เพิ่มสินค้า → `/inventory`, นำเข้าข้อมูล → `/import`, คำนวณกำไร → `/calculator` — แสดงเฉพาะปุ่มที่ role นั้นมีสิทธิ์ตาม `NAV_PERMISSIONS` (เช่น Affiliate เห็นเฉพาะทางลัดนำเข้าข้อมูล Affiliate)
  - **กิจกรรมล่าสุด:** Mini activity feed — empty state จนต่อ API
- Touch target ปุ่มทางลัด ≥ 44px

---

## Data & Empty State

- **ไม่ใช้ mock data** — ตามนโยบาย DEV_SPEC
- ค่า KPI, รายรับ 7 วัน, สต็อกใกล้หมด, กิจกรรม: แสดง "—" หรือข้อความ empty state (i18n) จนกว่าต่อ API
- เมื่อมี API: แทนที่ด้วยข้อมูลจาก API ใน component ที่เกี่ยวข้อง

---

## ไฟล์ที่เกี่ยวข้อง

| ไฟล์ | บทบาท |
|------|--------|
| `app/[locale]/page.tsx` | หน้า Dashboard (server component), ประกอบ Section A + ลำดับ B/C/D |
| `components/dashboard/DashboardSection.tsx` | Component section ย่อ/ขยาย (client), localStorage key: `dashboard-section-{id}-expanded` |
| `components/dashboard/ImportInsights.tsx` | บล็อกนำเข้าข้อมูล (Admin/SuperAdmin only) |
| `messages/th.json`, `messages/en.json` | คีย์ `dashboard.*` (ดูตาราง i18n ด้านล่าง) |

---

## i18n Keys (หลัง implement)

| Key | TH | EN |
|-----|----|----|
| `dashboard.title` | Dashboard | Dashboard |
| `dashboard.description` | ภาพรวมของสินค้าคงคลังและคำสั่งซื้อของคุณ | Overview of your inventory and orders |
| `dashboard.sections.importInsights` | นำเข้าข้อมูล | Import insights |
| `dashboard.sections.revenueStock` | รายรับและสต็อก | Revenue & stock |
| `dashboard.sections.shortcutsActivity` | ทางลัดและกิจกรรม | Shortcuts & activity |
| `dashboard.totalProducts` | สินค้าทั้งหมด | Total Products |
| `dashboard.lowStock` | สต็อกต่ำ | Low Stock |
| `dashboard.importInsights.*` | (ย่อยใน importInsights) | — |

Section titles ใช้จาก `getTranslations("dashboard")` แล้ว `t("sections.importInsights")` เป็นต้น

---

## Implementation Notes (หลังทำเสร็จ)

- **Section A:** `<section>` + `aria-labelledby="dashboard-overview-heading"`, ไม่ใช้ DashboardSection; KPI ใช้ `KPI_CARDS` (2 การ์ด: totalProducts, lowStock), grid `grid-cols-2 lg:grid-cols-4`, การ์ดแรก `lg:col-span-2`.
- **Section B:** `defaultOpen={true}`, summary=`t("importInsights.subtitle")`, icon `<BarChart3 />`.
- **Section C:** `defaultOpen={false}`, `chartCount={2}`; ภายในเป็น grid `lg:grid-cols-3` (รายรับ 7 วัน `lg:col-span-2` + สต็อกใกล้หมด); icon `<BarChart3 />`; DAYS = ["จ","อ","พ",...].
- **Section D:** `defaultOpen={false}`, `chartCount={2}`; ทางลัดใช้ `QUICK_ACTIONS` (array ปุ่ม) และกรองด้วย `NAV_PERMISSIONS` + `usePermissions().can` ก่อนแสดง, ปุ่มมี `min-h-[44px]`; icon `<Zap />`.
- **DashboardSection:** client component, อ่าน/เขียน localStorage หลัง mount เพื่อไม่ให้ hydration mismatch; ใช้ `shrink-0` สำหรับ icon, `focus:ring-primary/30`.

---

## Acceptance Criteria (สรุป)

- [x] Route `/` ใช้ permission `dashboard:read`
- [x] **ลำดับการนำเสนอ** ตรงกับลำดับเรื่องเล่า (A → B → C → D; ภายใน C: รายรับก่อน สต็อกใกล้หมดหลัง)
- [x] Section A (ภาพรวม) แสดงตลอด ไม่มีปุ่มยุบ
- [x] Section B, C, D ใช้ DashboardSection; สถานะเปิด/ปิดเก็บใน localStorage
- [x] Responsive default เปิด/ปิดตาม breakpoint (B เปิด, C/D ปิด)
- [x] Touch target ≥ 44px; ARIA สำหรับปุ่ม section
- [x] ไม่ใช้ mock data; แสดง empty state หรือ "—" จนต่อ API
- [x] ข้อความทั้งหมดจาก i18n (`dashboard.*`)
- [ ] KPI Cards 4 ใบ (totalRevenue, totalDiscount, netProfit*, aov) — **Phase current:** หากยังไม่มี order feed ให้ fallback เป็น KPI inventory (totalProducts, lowStock) และระบุใน release note; อัปเดตเมื่อ order analytics พร้อม

\* netProfit ไม่รวมต้นทุนสินค้า
