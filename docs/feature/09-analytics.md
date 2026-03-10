# Feature Spec — ศูนย์วิเคราะห์ (Analytics Hub)

สรุปฟีเจอร์และพฤติกรรม — หน้าวิเคราะห์เชิงลึก  
**อ้างอิง:** Congrats-seller `analytics/` (revenue, products, discounts, trends, profitability)

**Last Updated:** 2026-03-23  
**Status (Phase 1):** เปิดใช้เฉพาะ Revenue & Products แล้ว; หน้า Discounts / Trends / Profitability ถูกซ่อนชั่วคราวจนกว่าจะมีข้อมูลและ API ครบ

> Phase cut 2026-03-10: ลดขอบเขตเพื่อเตรียม go-live เร็วขึ้น  
> - Routes/menus ที่ยัง placeholder ถูกปิด (404/hidden)  
> - Hub แสดงเฉพาะ 2 การ์ด: Revenue, Products  
> - เมื่อข้อมูล/endpoint พร้อมแล้วค่อยเปิด Discounts, Trends, Profitability อีกครั้ง

---

## ภาพรวม

หน้านี้ให้แม่ค้าดูข้อมูลเชิงลึกหลังจาก import ข้อมูลจาก TikTok Shop แล้ว  
ไม่ได้ดู raw orders — อ่านจากข้อมูลที่ import เข้ามาใน Inventory + OrderImport models  
เข้าถึงได้จาก Dashboard "ทางลัด" หรือ Sidebar

---

## Route & Permission

| Route | ชื่อหน้า | Permission | สถานะ |
|-------|---------|------------|--------|
| `/analytics` | ศูนย์วิเคราะห์ (Hub) | `analytics:read` | ✅ ใช้งาน |
| `/analytics/revenue` | รายได้และค่าธรรมเนียม | `analytics:read` | ✅ ใช้งาน |
| `/analytics/products` | ผลงานสินค้า | `analytics:read` | ✅ ใช้งาน |
| `/analytics/discounts` | วิเคราะห์ส่วนลด | `analytics:read` | 🚫 ซ่อน (Phase 1) |
| `/analytics/profitability` | วิเคราะห์กำไร | `analytics:read` | 🚫 ซ่อน (Phase 1) |
| `/analytics/trends` | แนวโน้ม | `analytics:read` | 🚫 ซ่อน (Phase 1) |

## Role Access (Phase 1)

> **เฉพาะ Root และ Affiliate เท่านั้น** — Admin, SuperAdmin ยังไม่ได้รับสิทธิ์ในระยะแรก

| Role | สิทธิ์ analytics:read |
|------|----------------------|
| Root | ✅ ใช่ |
| Affiliate | ✅ ใช่ |
| Admin | ❌ ไม่ (ยังไม่ได้รับ) |
| SuperAdmin | ❌ ไม่ (ยังไม่ได้รับ) |

### การ implement

1. **`lib/rbac/constants.ts`** — เพิ่ม `"analytics"` ใน RESOURCES array และ `/analytics` ใน NAV_PERMISSIONS
2. **`lib/rbac/role-permissions.ts`** — เพิ่ม `"analytics:read"` เฉพาะ `rootPermissions` และ `affiliatePermissions`
3. ทุก sub-page ใช้ `<RequirePermission permission="analytics:read">` wrap เนื้อหา
4. Sidebar filter อัตโนมัติจาก NAV_PERMISSIONS + `can()` hook — ไม่ต้องแก้ logic Sidebar

---

## Hub Page (`/analytics`)

### Layout
- Header: ไอคอน `BarChart3` + ชื่อ "ศูนย์วิเคราะห์ข้อมูล" + description
- Grid card: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Card แต่ละใบมี: ไอคอน, ชื่อ, คำอธิบาย, mini metrics 2 ตัว, arrow right (hover/active)
- Banner ล่าง: "เริ่มต้นใช้งาน" → ลิงก์ `/import` ถ้ายังไม่มีข้อมูล

### Analytics Cards (Phase 1)

| Card | href | ไอคอน | สถานะ |
|------|------|-------|--------|
| รายได้และค่าธรรมเนียม | `/analytics/revenue` | `DollarSign` | ✅ |
| ผลงานสินค้า | `/analytics/products` | `Package` | ✅ |
| วิเคราะห์ส่วนลด | `/analytics/discounts` | `Percent` | 🚫 Hidden |
| แนวโน้ม | `/analytics/trends` | `Activity` | 🚫 Hidden |
| วิเคราะห์กำไร | `/analytics/profitability` | `Wallet` | 🚫 Hidden |

### พฤติกรรม

- คลิก card → navigate ไป sub-page
- ถ้าไม่มีข้อมูล (no import) → แสดง banner "นำเข้าข้อมูลก่อน" + ลิงก์ `/import`
- Metric mini ใน card: แสดง "—" จนกว่ามีข้อมูล (ไม่ใช้ mock)

---

## Sub-pages (ทั้ง 5 หน้า)

### ส่วนร่วมของทุก sub-page

- **Header:** ชื่อหน้า + description + `GlobalDateRangePicker` (sync ผ่าน URL searchParams `startDate`, `endDate`)
- **Default range:** 30 วันล่าสุด
- **Demo banner:** แสดงเมื่อยังไม่มีข้อมูล — "แสดงข้อมูลตัวอย่าง / นำเข้าข้อมูลเพื่อดูข้อมูลจริง"
- **Insight banner:** `InsightFirstWrapper` แสดง insight สั้นๆ เหนือแต่ละ chart (severity: success/info/warning/danger)
- **Loading skeleton:** animate-pulse สำหรับ KPI cards และ charts
- **Error state:** ข้อความ + ปุ่ม "ลองใหม่"
- **Mobile:** KPI cards = horizontal scroll (`overflow-x-auto snap-x`); Charts = `ChartCarousel` 2 หน้า; ตาราง = `overflow-x-auto`
- **Desktop:** KPI grid `lg:grid-cols-4`; Charts = grid 2 คอลัมน์

---

### 1. รายได้และค่าธรรมเนียม (`/analytics/revenue`)

**Goal:** ดูเส้นทางเงิน ตั้งแต่ยอดขาย → ค่าธรรมเนียม → รับชำระจริง

#### KPI Cards (4 ใบ)

| ใบ | ชื่อ | ข้อมูล |
|----|------|--------|
| 1 | ยอดขายรวม | `gmv` (ราคาก่อนส่วนลดรวม) |
| 2 | รับชำระจริง | `settlement` |
| 3 | ค่าธรรมเนียมรวม | `totalFees` (ลบ) |
| 4 | กำไรสุทธิ | `netProfit` |

แต่ละใบมี `change` (% vs ช่วงก่อน) แสดง TrendingUp/Down icon สีเขียว/แดง

#### Charts

| Chart | ประเภท | ข้อมูล |
|-------|--------|--------|
| รายรับ & กำไร | AreaChart (2 เส้น) | revenue + profit รายวัน |
| Waterfall ยอดขาย→รับชำระ | WaterfallChart | gmv → fees → refund → settlement |
| สัดส่วนค่าธรรมเนียม | PieChart (donut) | fee breakdown by type |
| รายละเอียดค่าธรรมเนียม | Progress bar list | แต่ละ fee + % ของรวม |
| เส้นเวลาการรับชำระ | AreaChart (2 เส้น) | revenue vs settlement รายวัน |

**Fee breakdown types:**
- ค่าคอมมิชชั่น TikTok
- ค่าจัดส่ง
- ค่าคอม Affiliate
- ค่าธรรมเนียมธุรกรรม
- ค่าบริการอื่นๆ

#### Insight Rules

| เงื่อนไข | Severity | ข้อความ |
|----------|---------|---------|
| settlementRate ≥ 85% | success | รับชำระ X% - อัตราดีมาก |
| settlementRate 75–84% | info | ปกติ แต่ควรตรวจสอบค่าธรรมเนียม |
| settlementRate < 75% | danger | ค่าธรรมเนียมสูงเกินไป |
| refundRate > 5% | warning | การคืนเงินสูง ควรตรวจสอบคุณภาพ |

#### API

```
GET /api/analytics/reconciliation?shopId=&from=&to=
→ ReconciliationData

GET /api/analytics/daily-metrics?shopId=&from=&to=
→ DailyMetricsData { totals, timeSeries, hasData }
```

---

### 2. ผลงานสินค้า (`/analytics/products`)

**Goal:** วิเคราะห์ยอดขาย กำไร และประสิทธิภาพแต่ละสินค้า — เอาสินค้าทั้งหมดมาวิเคราะห์

#### Controls (ด้านบน)
- **Date range:** `UrlDateRangePicker` (sync `startDate`, `endDate` กับ URL)
- **ต้นทุน/ชิ้น (฿):** input ตัวเลข — ใช้คำนวณกำไรและ margin โดยประมาณ (ไม่บันทึก); ถ้าไม่ใส่ กำไร/margin ในตารางและ tier จะแสดง "—" / "ไม่มีต้นทุน"

#### KPI / Summary Cards (4 ใบ)
- แต่ละการ์ดมี **left border สี** + **icon ในกล่องสี** (semantic)
- **รายได้รวม** — สีน้ำเงิน (blue)
- **กำไรรวม** — สีเขียว (กำไรบวก) / แดง (ขาดทุน) / เทา (ยังไม่ตั้งต้นทุน)
- **จำนวนขาย** — สีม่วง (violet) + จำนวน SKU
- **การ์ดที่ 4:** ถ้ามีต้นทุน → **Avg Margin** (สีตามระดับ margin); ถ้าไม่มี → **สินค้าขายดีสุด** + ยอดขาย

#### Portfolio Insights (Banner แนวนอน)
- แทนการ์ด 4 ใบย่อย — แสดงเป็น **banner เดียว** ตามระดับความเสี่ยง concentration
- **ข้อความ:** "Concentration Risk สูง" (amber) / "Revenue กระจายปานกลาง" (blue) / "Revenue กระจายดี" (emerald) ตามสัดส่วน top 3
- แสดง: top 3 %, อันดับ 1 % + ชื่อสินค้า, จำนวน SKU กำไร/ขาดทุน (เมื่อมีต้นทุน), หรือข้อความ "ยังไม่ได้ตั้งต้นทุน"

#### จัดกลุ่มสินค้า (Product Tier)
- แสดงเมื่อมีสินค้าอย่างน้อย 2 SKU (ไม่ต้องมีต้นทุน)
- **Tier 4 กลุ่ม:** Stars · ควรดูแล · ขาดทุน · Long Tail  
  - **Stars:** revenue ≥ median และ (ไม่มีต้นทุน หรือ margin ≥ 15%)  
  - **ควรดูแล:** revenue ≥ median และ margin 0–15% (แสดงเมื่อมีต้นทุนเท่านั้น)  
  - **ขาดทุน:** margin &lt; 0 (แสดงเมื่อมีต้นทุนเท่านั้น)  
  - **Long Tail:** revenue &lt; median และไม่ขาดทุน
- **Layout:** Grid ปรับตามจำนวน tier ที่มี (1 → 1 col, 2 → 2 col, 3 → 3 col, 4 → 2x2 / 4 col)
- **การ์ดแต่ละใบ:**
  - แถบสีด้านบน (accent strip) สีตาม tier
  - Header: icon + ชื่อกลุ่ม + **ตัวเลขจำนวน SKU ใหญ่** ด้านขวา
  - คำอธิบายสั้น (desc)
  - รายการสินค้า preview 3 แถว (padding ให้สูงเท่ากันทุกการ์ด)
  - Footer: "+N เพิ่มเติม" หรือ "ทั้งหมด N SKU" + ChevronDown
- **พฤติกรรม:** คลิกการ์ด → ขยาย panel ด้านล่างแสดง **ตารางเต็ม** ของสินค้าในกลุ่มนั้น (ชื่อ, จำนวน, ยอดขาย, กำไร, Margin) + แถวรวม + ปุ่ม "ปิด"
- การ์ดที่เลือก (active): พื้นหลังเข้มขึ้น

#### Charts

| Chart | ประเภท | ข้อมูล |
|-------|--------|--------|
| สัดส่วนยอดขายต่อสินค้า | PieChart (donut) | top 7 by revenue + "อื่นๆ"; subtitle ยอดรวม |
| Top สินค้าขายดี | รายการ + progress bar | 8 อันดับ; progress bar สีตาม tier (Stars=emerald, ควรดูแล=amber, ขาดทุน=red, อื่น=blue); มี tier dot เล็กๆ |
| ยอดขาย vs กำไร | BarChart (grouped) | **ทุก SKU** (ไม่จำกัด top 10); full width; scroll แนวนอนเมื่อ SKU เยอะ |

#### ตารางสินค้าทั้งหมด

- **Legend ด้านบน:** "ตารางสินค้าทั้งหมด" + จุดสีอธิบาย tier (Stars / ควรดูแล / ขาดทุน / Long Tail)
- **Sort:** Desktop = ปุ่ม sort ที่ header คอลัมน์ (revenue / quantity / profit / margin); Mobile = Sort chips
- **คอลัมน์:** # (rank badge + tier dot) · ชื่อสินค้า · จำนวนขาย · รายได้ · กำไร · Margin (badge)
- **แถว:** จุดสีซ้ายตาม tier; hover แถวเป็นสีอ่อนตาม tier; กำไรบวกสีเขียว ขาดทุนสีแดง
- แถวที่ไม่มีต้นทุน: กำไร/Margin แสดง "—" หรือ badge "ไม่มีต้นทุน"

#### No-Cost Callout (เมื่อยังไม่ตั้งต้นทุน)
- Banner สี amber/orange gradient
- หัวข้อ: "ปลดล็อกการวิเคราะห์กำไรและ Margin"
- ข้อความ: ตั้งต้นทุน/ชิ้นด้านบน หรือลิงก์ **จัดการ Inventory** (แสดงเฉพาะเมื่อมี permission `inventory:read`; Affiliate แสดงเฉพาะข้อความแนะนำโดยไม่มีลิงก์)

#### Insight Rules (อ้างอิง)

| เงื่อนไข | Severity |
|----------|---------|
| สินค้า >30% ไม่มีต้นทุน | warning |
| สินค้าที่ขายดีสุดมี margin < 10% | danger |
| สินค้าขายดีสุดมี margin > 25% | success |

#### API

```
GET /api/analytics/product-metrics?from=&to=
→ { products: ProductMetric[], hasData: boolean, from, to }
```

- Backend อ่านจาก `import_sku_row` (หรือ affiliate path ตาม role); กรอง `deleted_at IS NULL`; group by `sku_id` — ส่งกลับ **ทุก SKU** ในช่วงวันที่

```typescript
interface ProductMetric {
  skuId: string;
  name: string;
  category: string;
  quantity: number;
  revenue: number;
  profit: number | null;   // null = ไม่มีต้นทุน
  profitMargin: number | null;
  hasCost: boolean;
}
```

---

### 3. วิเคราะห์ส่วนลด (`/analytics/discounts`)

**Goal:** ประเมิน ROI ของส่วนลด หา sweet spot ที่ได้กำไรและยอดขายดีที่สุด

#### KPI Cards

| ใบ | ชื่อ |
|----|------|
| 1 | ส่วนลดร้านรวม |
| 2 | ส่วนลด Platform รวม |
| 3 | % ส่วนลดเฉลี่ย |
| 4 | ผลกระทบต่อกำไร |

#### Charts

| Chart | ประเภท | ข้อมูล |
|-------|--------|--------|
| Sweet Spot | LazyDiscountSweetSpotChart | discount% vs profit |
| ประสิทธิภาพโปรโมชั่น | LazyDiscountEffectivenessChart | discount vs revenue/margin |
| Discount Timeline | LineChart | avgDiscount% + revenue รายสัปดาห์ |

#### Product Table

- แสดงทุก SKU + `platformDiscount` + `sellerDiscount` + `profit` + `profitMargin`
- highlight สินค้าที่ `sellerDiscount > 40%` และ `profitMargin < 0` ด้วยสีแดง

#### Insight Rules

| เงื่อนไข | Severity |
|----------|---------|
| sellerDiscount เฉลี่ย > 40% | danger |
| มีสินค้าที่ discount แล้วขาดทุน | warning |
| sweet spot discount อยู่ที่ 20–30% | success |

#### API

```
GET /api/analytics/product-metrics?shopId=&from=&to=
(เดียวกับ products — เพิ่มฟิลด์ platformDiscount, sellerDiscount)
```

---

### 4. แนวโน้ม (`/analytics/trends`)

**Goal:** ดูการเติบโต เปรียบเทียบเดือน ดูช่วงเวลาที่ขายดี (peak season)

#### Toggle Period
- ปุ่มเลือก: **รายสัปดาห์** | **รายเดือน**

#### Charts

| Chart | ประเภท | ข้อมูล |
|-------|--------|--------|
| รายรับตามช่วงเวลา | AreaChart | revenue per bucket |
| การเติบโต MoM | BarChart + ReferenceLine (0%) | % growth month-over-month |
| เปรียบเทียบปี YoY | GroupedBarChart | currentYear vs previousYear |
| Peak Hour (ถ้ามีข้อมูล) | Heatmap หรือ BarChart | orders by hour/day |

#### KPI Cards

| ใบ | ชื่อ |
|----|------|
| 1 | Growth MoM ล่าสุด |
| 2 | เดือนที่ดีที่สุด |
| 3 | ช่วงพีค (วัน/เวลา) |
| 4 | เดือนที่แย่ที่สุด |

#### Growth Badge
- `> +15%` → badge สีเขียว `TrendingUp`
- `0–15%` → badge สีเหลือง `Minus`
- `< 0` → badge สีแดง `TrendingDown`

#### Insight Rules

| เงื่อนไข | Severity |
|----------|---------|
| MoM growth ต่ำกว่า 0 ติด 2 เดือน | warning |
| MoM growth > 20% | success |
| YoY growth > 0 | info |

#### API

```
GET /api/analytics/trends?shopId=&from=&to=&period=weekly|monthly
→ {
    buckets: TrendBucket[],
    monthlyBuckets: TrendBucket[],
    momGrowth: MomGrowth[],
    yoy: YoyItem[],
    hasData: boolean
  }
```

```typescript
interface TrendBucket {
  key: string;
  label: string;
  revenue: number;
  orders: number;
  profit: number;
  discount: number;
  days: number;
}
```

---

### 5. วิเคราะห์กำไร (`/analytics/profitability`)

**Goal:** เจาะลึก margin รายสินค้า + What-if calculator ปรับสมมติฐานดูผลทันที

#### ส่วนที่ 1: ข้อมูลจริง

| Chart | ประเภท | ข้อมูล |
|-------|--------|--------|
| Margin Distribution | Histogram | จำนวนสินค้าต่อ margin range |
| Profit by Category | HorizontalBarChart | profit แยก category |
| Margin Trend | LineChart | margin% รายสัปดาห์/เดือน |

**ChartNarrative:** แสดง insight ข้อความใต้แต่ละ chart (ใช้ `profitMarginNarrative` helper)

#### ส่วนที่ 2: What-if Calculator

ให้แม่ค้าปรับสมมติฐาน 4 ตัว แล้วดูผลทันที:

| Input | ค่าเริ่มต้น | ประเภท |
|-------|------------|--------|
| ราคาขาย | ฿1,000 | number input |
| ต้นทุน | ฿600 | number input |
| ค่าธรรมเนียม % | 15% | number input |
| ส่วนลด % | 20% | number input |

**ผลลัพธ์ที่แสดง:**

| ตัวเลข | สูตร |
|--------|------|
| ราคาหลังส่วนลด | `price × (1 - discount%)` |
| ค่าธรรมเนียม | `sellingPrice × fee%` |
| กำไร | `sellingPrice - cost - fees` |
| อัตรากำไร | `profit / sellingPrice × 100` |
| Break-even units | `cost / (sellingPrice - cost - fees)` |

- อัตรากำไร < 10% → แสดงสีแดง + insight "ต่ำเกินไป ควรปรับ"
- อัตรากำไร 10–20% → สีเหลือง + insight "พอใช้ แต่ควรเพิ่ม"
- อัตรากำไร ≥ 20% → สีเขียว + insight "ดี"
- ลิงก์ "ใช้เครื่องคำนวณต้นทุนแบบละเอียด" → `/calculator`

#### Insight Rules

| เงื่อนไข | Severity |
|----------|---------|
| สินค้า >50% มี margin < 15% | danger |
| margin เฉลี่ยลดลงต่อเนื่อง 3 เดือน | warning |
| margin เฉลี่ย > 25% | success |

#### API

```
GET /api/analytics/profitability?shopId=&from=&to=
→ {
    avgMargin: number,
    marginBuckets: { range: string; count: number }[],
    byCategory: { category: string; profit: number; margin: number }[],
    marginTrend: { label: string; margin: number }[],
    hasData: boolean
  }
```

---

## Data Architecture

### Data Source
- อ่านจาก `OrderImport` + `ProductImport` ที่ import เข้ามาผ่านหน้า `/import`
- ไม่ query raw orders โดยตรง — ใช้ pre-aggregated หรือ compute ที่ API layer
- ถ้า shop ไม่มีข้อมูล import → `hasData: false` → แสดง demo data + banner

### Demo Data
- ใช้เมื่อ `hasData: false` เท่านั้น
- ต้องมี banner "แสดงข้อมูลตัวอย่าง" สีแดง/amber ชัดเจน
- ห้ามแสดง demo เหมือนของจริง

### Date Range
- ส่งผ่าน URL searchParams: `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- `GlobalDateRangePicker` อยู่ใน header แต่ละ sub-page
- Default: 30 วันล่าสุด (คำนวณ client-side)

---

## ไฟล์ที่ต้องสร้าง

| ไฟล์ | บทบาท |
|------|--------|
| `app/[locale]/analytics/page.tsx` | Hub — grid cards 5 sub-pages |
| `app/[locale]/analytics/revenue/page.tsx` | รายได้และค่าธรรมเนียม |
| `app/[locale]/analytics/products/page.tsx` | ผลงานสินค้า |
| `app/[locale]/analytics/discounts/page.tsx` | วิเคราะห์ส่วนลด |
| `app/[locale]/analytics/trends/page.tsx` | แนวโน้ม |
| `app/[locale]/analytics/profitability/page.tsx` | วิเคราะห์กำไร |
| `app/api/analytics/reconciliation/route.ts` | API รายได้/settlement |
| `app/api/analytics/daily-metrics/route.ts` | API time series รายวัน |
| `app/api/analytics/product-metrics/route.ts` | API per-SKU metrics |
| `app/api/analytics/trends/route.ts` | API trend buckets |
| `app/api/analytics/profitability/route.ts` | API margin analysis |
| `components/shared/GlobalDateRangePicker.tsx` | Date range component (shared) |
| `components/shared/InsightFirstWrapper.tsx` | Insight banner wrapper |
| `components/shared/ChartCarousel.tsx` | Mobile chart carousel |
| `components/shared/ChartNarrative.tsx` | Chart narrative text |
| `lib/chart-narratives.ts` | Narrative helper functions |

---

## ไฟล์ที่ต้องแก้

| ไฟล์ | การแก้ไข |
|------|---------|
| `messages/th.json` | เพิ่ม `analytics.*` keys |
| `messages/en.json` | เพิ่ม `analytics.*` keys |
| `components/layout/Sidebar.tsx` | เพิ่มเมนู "ศูนย์วิเคราะห์" ลิงก์ `/analytics` |
| `app/[locale]/page.tsx` | Section D: ทางลัด → เพิ่มปุ่ม `/analytics` |

---

## i18n Keys

| Key | TH | EN |
|-----|----|----|
| `analytics.title` | ศูนย์วิเคราะห์ข้อมูล | Analytics Hub |
| `analytics.description` | เลือกหมวดการวิเคราะห์เพื่อเพิ่มยอดขายและลดต้นทุน | Choose an analytics category to boost sales and reduce costs |
| `analytics.noData` | แสดงข้อมูลตัวอย่าง — นำเข้าไฟล์ขายเพื่อดูข้อมูลจริง | Showing demo data — import sales file to see real data |
| `analytics.goImport` | ไปหน้านำเข้าข้อมูล | Go to import |
| `analytics.revenue.title` | รายได้และค่าธรรมเนียม | Revenue & Fees |
| `analytics.revenue.description` | ติดตามรายได้ ค่าธรรมเนียม และเงินที่ได้รับจริง | Track revenue, fees, and actual settlements |
| `analytics.products.title` | ผลงานสินค้า | Product Performance |
| `analytics.products.description` | วิเคราะห์ยอดขาย กำไร ประสิทธิภาพแต่ละสินค้า | Analyze sales, profit, and performance per product |
| `analytics.discounts.title` | วิเคราะห์ส่วนลด | Discount Analysis |
| `analytics.discounts.description` | ประเมินผลส่วนลด หา sweet spot ที่เหมาะสม | Evaluate promotions and find the optimal discount level |
| `analytics.trends.title` | แนวโน้ม | Trends |
| `analytics.trends.description` | เปรียบเทียบการเติบโต รายเดือน และฤดูกาลขาย | Compare growth, monthly performance, and seasonal patterns |
| `analytics.profitability.title` | วิเคราะห์กำไร | Profitability Analysis |
| `analytics.profitability.description` | วิเคราะห์ margin และต้นทุนแบบละเอียด พร้อม What-if | Analyze margin and costs in detail with What-if calculator |

---

## Design Pattern

- **สี:** ใช้ semantic tokens (`primary`, `muted`, `card`, `border`) — ไม่ใช้ brown palette
- **Cards:** `rounded-2xl border bg-card shadow-sm` (ไม่ใช้ rounded-[28px] แบบ Congrats-seller)
- **KPI horizontal scroll:** `flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory` + `min-w-[160px] snap-start` (เหมือน Congrats-seller)
- **Mobile charts:** `ChartCarousel` แสดงทีละ chart พร้อม dot indicator
- **Insight banner:** `InsightFirstWrapper` อยู่เหนือ chart — severity กำหนดสีและไอคอน
- **Touch targets:** ≥ 44px ทุกปุ่ม (`min-h-[44px]`)
- **Chart library:** Recharts (AreaChart, BarChart, PieChart, LineChart, ComposedChart)

---

## Acceptance Criteria (Phase 1 — Revenue & Products live)

- [ ] Hub แสดงเฉพาะการ์ด Revenue และ Products; การ์ดอื่นถูกซ่อน
- [ ] Routes `/analytics/discounts`, `/analytics/trends`, `/analytics/profitability` ถูกปิด/404
- [ ] Revenue page ใช้ API จริง (`reconciliation`, `daily-metrics`); แสดง empty state เมื่อไม่มีข้อมูล
- [ ] Products page ใช้ API จริง (`product-metrics`); แสดง **สินค้าทั้งหมด** ใน bar chart และตาราง (ไม่จำกัด top 10)
- [ ] Products: มี Summary cards 4 ใบ (รายได้/กำไร/จำนวน/avg margin หรือ top product) + Portfolio Insights banner (concentration risk)
- [ ] Products: จัดกลุ่มสินค้า (Stars / ควรดูแล / ขาดทุน / Long Tail) แสดงเมื่อมี ≥2 SKU; การ์ดกดขยายดูรายละเอียดในกลุ่ม; layout grid ปรับตามจำนวน tier
- [ ] Products: ตารางมี tier dot + legend; แถว hover สีตาม tier; No-cost callout + ลิงก์ Inventory ตาม permission
- [ ] KPI/ตารางใช้ i18n (`analytics.*`) และ permission `analytics:read`
- [ ] Backend product-metrics กรอง `deleted_at IS NULL`; ไม่มี TypeScript errors (`npx tsc --noEmit`)
