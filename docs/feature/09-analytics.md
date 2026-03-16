# Feature Spec — ศูนย์วิเคราะห์ (Analytics Hub) — FE

**Scope:** ฝั่ง FE เท่านั้น. API / data logic ดู **account-stock-be/docs/feature/05-analytics.md**

**Last Updated:** 2026-03-12  
**Status:** Revenue, Products, Trends, Profitability เปิดใช้。Discounts รอ BE (ตาราง + API ส่วนลดแยก)。

---

## ภาพรวม

แม่ค้าดูข้อมูลเชิงลึกหลัง import จาก TikTok Shop. เข้าถึงจาก Dashboard ทางลัด หรือ Sidebar。

---

## Route & Permission

| Route | ชื่อ | Permission | สถานะ |
|-------|------|------------|--------|
| `/analytics` | Hub | `analytics:read` | ✅ |
| `/analytics/revenue` | รายได้และค่าธรรมเนียม | `analytics:read` | ✅ |
| `/analytics/products` | ผลงานสินค้า | `analytics:read` | ✅ |
| `/analytics/trends` | แนวโน้ม | `analytics:read` | ✅ |
| `/analytics/profitability` | วิเคราะห์กำไร | `analytics:read` | ✅ |
| `/analytics/discounts` | วิเคราะห์ส่วนลด | `analytics:read` | 🚫 รอ BE |

**Role (Phase 1):** เฉพาะ **Root** และ **Affiliate** — Admin/SuperAdmin ยังไม่ได้รับ.

Implement: `lib/rbac/role-permissions.ts` ใส่ `analytics:read` เฉพาะ root + affiliate; ทุก sub-page ใช้ `RequirePermission permission="analytics:read"`.

---

## Hub (`/analytics`)

- Header: BarChart3 + ชื่อ + description (i18n)
- Grid: `lg:grid-cols-4` — Card: Revenue, Products, Trends, Profitability (Discounts ยังไม่แสดง)
- แต่ละ card: icon, ชื่อ, คำอธิบาย, mini metrics 2 ตัว (จาก Dashboard KPIs หรือ "—"), ลิงก์ไป sub-page
- Banner ล่าง: gettingStartedTitle/Desc → ลิงก์ `/import`

---

## Sub-pages ร่วม

- Header + `UrlDateRangePicker` (sync `startDate`, `endDate` กับ URL). Default range 30 วัน (Trends 90 วัน)
- Empty: ข้อความ + ลิงก์ `/import`. Loading: `AnalyticsLoadingSkeleton`. Error: ข้อความ `loadError` + ปุ่ม `retry`
- Insight: `InsightFirstWrapper` (severity: success/info/warning/danger)
- Mobile: KPI horizontal scroll; ตาราง overflow-x-auto。ChartCarousel (optional) แสดงทีละ chart + dot

---

### 1. Revenue (`/analytics/revenue`)

- **KPI 4 ใบ:** gmv, settlement, totalFees, netProfit (มี change %)
- **Charts:** AreaChart รายรับ&กำไร; PieChart fee breakdown; Progress list รายละเอียด fee; AreaChart revenue vs settlement
- **Insight:** settlementRate ≥85% success, 75–84% info, <75% danger (i18n: insightGood, insightNormal, insightLow)
- **hasData:** ใช้ `reconHasMeaningfulData || dailyMetrics.hasData` (ไม่ใช่แค่มี recon response)
- **API:** reconciliation + daily-metrics → รายละเอียด BE spec

---

### 2. Products (`/analytics/products`)

- **Controls:** UrlDateRangePicker; ต้นทุน/ชิ้น (input ไม่บันทึก — ใช้คำนวณ margin/tier)
- **KPI 4 ใบ:** รายได้รวม, กำไรรวม, จำนวนขาย, การ์ดที่ 4 = Avg Margin หรือ สินค้าขายดีสุด
- **Portfolio Insights:** Banner ตาม concentration (top 3 %); ข้อความตามระดับ risk
- **Tier (จัดกลุ่ม):** Stars (revenue≥median, margin≥15%), Watch (revenue≥median, margin 0–15%), Losing (margin<0), Long Tail (revenue<median). คลิกการ์ด → ขยายตารางสินค้าในกลุ่ม
- **Charts:** Pie top 7 + อื่นๆ; รายการ Top สินค้า + progress bar (สีตาม tier); BarChart ทุก SKU revenue vs profit
- **ตาราง:** คอลัมน์ rank, ชื่อ, จำนวน, รายได้, กำไร, Margin; tier dot; sort ได้
- **No-cost callout:** Banner + ลิงก์ Inventory (เมื่อมี permission)
- **API:** product-metrics → BE spec

---

### 3. Discounts (`/analytics/discounts`) — รอ BE

- ต้องการ BE: คอลัมน์ platform_discount, seller_discount + API คืน 2 ฟิลด์。FE ยังไม่ทำ

---

### 4. Trends (`/analytics/trends`)

- Toggle: รายสัปดาห์ | รายเดือน (period ส่งไป API)
- **KPI:** Growth MoM, เดือนที่ดี/แย่
- **Charts:** AreaChart revenue ตาม bucket; BarChart MoM growth; YoY comparison。Peak Hour optional
- **API:** GET /api/analytics/trends (from, to, period) — รายละเอียด BE spec

---

### 5. Profitability (`/analytics/profitability`)

- **ข้อมูลจริง:** Margin Distribution, Profit by Category, Margin Trend; ChartNarrative ใต้ chart
- **What-if:** Input 4 ตัว (ราคา, ต้นทุน, fee%, discount%) → คำนวณ ราคาหลังส่วนลด, ค่าธรรมเนียม, กำไร, อัตรากำไร, break-even; สี/insight ตาม margin; ลิงก์ `/calculator`
- **API:** GET /api/analytics/profitability — รายละเอียด BE spec

---

## Data

- อ่านจาก OrderImport/ProductImport ผ่าน API。ไม่มี import → hasData false → empty state + ลิงก์ import
- Date range: URL `startDate`, `endDate`。GlobalDateRangePicker ใน header

---

## ไฟล์ที่เกี่ยวข้อง

| หน้าที่ | ไฟล์ |
|--------|------|
| Hub | `app/[locale]/analytics/page.tsx` |
| Revenue | `app/[locale]/analytics/revenue/page.tsx` |
| Products | `app/[locale]/analytics/products/page.tsx` |
| Trends | `app/[locale]/analytics/trends/page.tsx` |
| Profitability | `app/[locale]/analytics/profitability/page.tsx` |
| Shared | `GlobalDateRangePicker`, `InsightFirstWrapper`, `AnalyticsLoadingSkeleton`, `ChartCarousel`, `ChartNarrative` |
| API/types | `lib/hooks/use-api.ts`, `types/api/analytics.ts` |
| i18n | `messages/th.json`, `messages/en.json` → `analytics.*` |

---

## Acceptance Criteria (FE)

- [x] Hub 4 cards (Revenue, Products, Trends, Profitability); Discounts ไม่แสดง
- [x] Revenue: empty/loading/error; hasData จาก recon มีค่าหรือ dailyMetrics.hasData; Insight + i18n
- [x] Products: tier 0–15% รวม margin 0; Summary + Portfolio Insights + จัดกลุ่ม (กดขยาย); No-cost callout + ลิงก์ Inventory ตาม permission
- [x] Trends, Profitability: หน้า + hook เรียก API; period/What-if ตาม spec
- [x] i18n ครบ analytics.*; Loading/Error pattern ครบ
- [ ] Discounts: รอ BE
- [ ] (Optional) ChartCarousel wrap charts บน mobile; Peak Hour เมื่อมีข้อมูล

---

## Remaining

| รายการ | หมายเหตุ |
|--------|----------|
| หน้า Discounts | รอ BE คอลัมน์ส่วนลดแยก + API |
| ChartCarousel บน mobile | component มีแล้ว, wrap ได้เมื่อต้องการ |
| Peak Hour (Trends) | optional เมื่อมีข้อมูลรายชั่วโมง |
