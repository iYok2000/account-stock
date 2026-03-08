# Feature Spec — Import (นำเข้าข้อมูล)

## ฟีเจอร์นี้ทำอะไร

ให้ผู้ใช้ **นำเข้ารายการขาย/คำสั่งซื้อ (Order Transaction)** จากไฟล์ CSV หรือ XLSX ที่ export มาจากแพลตฟอร์มขาย (เช่น Shopee, Lazada) แล้วระบบจะ **สรุปยอดขายและรายได้** ให้ — ระดับฟรีได้สรุปรวมและสรุปตามวัน ระดับเสียเงินได้รายการแยกตาม SKU (สินค้าชิ้นไหนขายได้เท่าไหร่ หักอะไร คืนเท่าไหร่). ข้อมูลที่ประมวลผลแล้วจะบันทึกไว้ใช้ดูในรายงาน (Reports) ได้ภายหลัง.

---

Phase 1: **Order Transaction** เท่านั้น — อัปโหลด CSV/XLSX → mapping + clean + parse (client) → Process → สรุปยอดตาม SKU/วัน → ส่ง JSON ไป API (ไม่เก็บไฟล์)

---

## สาระสำคัญ (ให้ AI / dev อ่านก่อน)

- **Route:** `/[locale]/import`. **Permission:** `inventory:create` (`lib/rbac/constants.ts`). User context ตาม [USER_SPEC.md](../USER_SPEC.md) (role, tier, company_id).
- **ไฟล์:** CSV, XLSX. สูงสุด **3.5 MB**, **50,000 แถว** (ตรวจใน `FileDropzone` + `parseFile` ใน `file-parser.ts`). ไม่อัปโหลดขึ้น server — อ่านใน browser → aggregate ฝั่ง client → POST JSON แล้วทิ้งไฟล์.
- **ฟิลด์ 15 ตัว:** ตรงกับ `ORDER_TRANSACTION_FIELDS` ใน `file-parser.ts`. จับคู่คอลัมน์อัตโนมัติด้วย `ORDER_TRANSACTION_HEADER_KEYWORDS` + `autoDetectMappings` (normalize: ตัวเล็ก, _ = ช่องว่าง; ตรงหรือใกล้เคียงความหมาย).
- **Wizard:** 1) เลือกประเภท (เฉพาะ Order Transaction) 2) อัปโหลด → parse → auto mapping → 3) แก้ mapping ได้ → validate → 4) Process → `aggregateOrderTransaction(rows, mappings, tier)` → POST `/api/import/order-transaction` → แสดง Result.
- **Tier:** **free** = สรุปยอด + สรุปเป็นวัน (daily). **paid** = สรุป + 1 SKU = 1 record. Payload ตรง `types/api/import.ts`: free → `{ tier, summary, daily }`, paid → `{ tier, summary, items }`.
- **การแบ่งค่าต่อ order (Shipping/Taxes ฯลฯ):** ใช้ **วิธี A** — แบ่งตามสัดส่วน SKU Subtotal After Discount ต่อ order. สูตร: `ส่วนแบ่ง SKU k = (Shipping+Taxes+...) × (Subtotal_k / sum(Subtotal ใน order))`. Implement ใน `aggregateOrderTransaction`.
- **API:** POST `/api/import/order-transaction` (body = JSON ตาม tier). Backend upsert ตาม company_id (+ date; paid: + sku_id). GET scope company_id; free = ระดับเดือน, paid = query `granularity=day|month`.
- **โค้ดหลัก:** `app/[locale]/import/page.tsx`, `components/upload/ImportWizard.tsx`, `FileDropzone.tsx`, `ColumnMapper.tsx`, `DataPreview.tsx`, `file-parser.ts` (parseFile, ORDER_TRANSACTION_FIELDS, ORDER_TRANSACTION_HEADER_KEYWORDS, autoDetectMappings, validateRows, normalizeOrderTransactionRow, aggregateOrderTransaction), `types/api/import.ts`.

---

## ฟิลด์เป้าหมาย (15 ฟิลด์ — ตรง `ORDER_TRANSACTION_FIELDS`)

| ฟิลด์ | จำเป็น | ใช้สำหรับ |
|--------|--------|------------|
| order_id, sku_id, quantity, sku_subtotal_after_discount | ใช่ | จัดกลุ่ม order/SKU, รายได้, ฐานคำนวณสัดส่วน |
| sku_platform_discount, sku_seller_discount | ไม่ | หักระดับ SKU |
| shipping_fee_after_discount, payment_platform_discount, taxes, small_order_fee | ไม่ | หักระดับ order → แบ่งตามสัดส่วน (วิธี A) |
| order_refund_amount, created_time | ไม่ | คืน, สรุปตามวัน |
| seller_sku, product_name, variation | ไม่ | แสดง (paid) |

---

## Clean / Parse / ความปลอดภัย

- Trim ช่องว่าง; ค่าว่างตัวเลข → 0; วันที่ parse เป็นรูปแบบเดียวกัน (แนะนำ ISO8601).
- Validation: ฟิลด์จำเป็น (order_id, sku_id ฯลฯ) ต้อง map และไม่ว่าง — `validateRows`.
- CSV injection: กันใน parser (prefix อันตรายด้วย `'`) — ทำแล้วใน `file-parser.ts`.

---

## สองระดับ: ฟรี vs เสียเงิน

| Tier | ผลลัพธ์ | Payload | Backend เก็บ |
|------|----------|--------|---------------|
| **free** | เห็นสรุปรายวัน (UI) แต่ backend เก็บ **SKU ต่อวัน** | items[] (มี `date` = YYYY-MM-DD) + (optional summary/daily สำหรับแสดงผล) | import_sku_row (key: company_id/shop_id + date + sku_id) |
| **paid** | เห็นราย SKU เต็ม (และแปลงเป็นรายวันได้จาก data เดียวกัน) | items[] (มี `date` = YYYY-MM-DD) + (optional summary/daily) | import_sku_row (key: company_id/shop_id + date + sku_id) |

- **Upsert:** key = (company_id/shop_id, date, sku_id). ถ้าไฟล์ซ้ำ → อัปเดต ไม่บวม.
- **Schema DB:** ใช้ตารางเดียว `import_sku_row` พอ; summary/daily คำนวณจากตารางนี้เวลาต้องใช้

---

## Backend (สรุป)

- **POST /api/inventory/import** — รับ `{ tier, items[], (summary?), (daily?) }` → upsert `import_sku_row` ด้วย key (shop_id, date, sku_id). ไม่รับไฟล์ ไม่ aggregate ฝั่ง server.
- **GET /api/inventory** — คืนรายการ SKU ล่าสุดของร้าน (สามารถ map กับ inventory_items หรือ view จาก import_sku_row).
- **GET /api/inventory/summary?period=current_month** — รวมจาก `import_sku_row` (uniqueSkus, unitsThisMonth, revenueThisMonth, netThisMonth, topSkus, lastImport).
- summary/daily ใน payload เป็น optional สำหรับ UI; แหล่งจริงคือ import_sku_row.

---

## UI / แสดงผล

- **หลัง Process:** แสดงในขั้น Result ของ wizard ที่ `/[locale]/import` เท่านั้น.
- **ดูข้อมูลที่บันทึกแล้ว:** Backend มี GET — แนะนำแสดงที่ **Reports** `/[locale]/reports` เมื่อ API พร้อม.

---

## Affiliate Import (คอมมิชชันพันธมิตร)

- **เงื่อนไข:** แสดงตัวเลือกเมื่อ role เป็น affiliate (เช่น `affiliate:read`). อัปโหลด XLSX/CSV จากแพลตฟอร์ม (เช่น TikTok) → auto mapping → validate → aggregate ฝั่ง client → แสดง Result (ยังไม่ POST ขึ้น backend).
- **Layout ผลลัพธ์:** หน้า Result ใช้ความกว้าง `max-w-6xl` (ไม่บีบ). ไม่แสดงบล็อก "ผ่านการตรวจสอบ" / "ข้าม" สำหรับ Affiliate.

### คอลัมน์ที่ใช้ (จับคู่จาก header ในไฟล์)

| คอลัมน์ในไฟล์ | ฟิลด์ในระบบ | ใช้สำหรับ |
|----------------|--------------|-----------|
| Order ID | order_id | รหัสคำสั่งซื้อ, นับจำนวนออเดอร์ต่อร้าน |
| SKU ID | sku_id | รหัส SKU |
| Price | price | ยอด (GMV เมื่อไม่มีคอลัมน์ GMV) และคำนวณ % กับ earn จริง |
| Product name | product_name | ชื่อสินค้า |
| Shop name | shop_name | ชื่อร้าน |
| Items sold | items_sold | จำนวนขาย |
| Content type | content_type | ประเภทคอนเทนต์ |
| **Order settlement status** | commission_status | **Ineligible = ไม่นำมาคิดเงินรายได้**; แมปเฉพาะหัว "Order settlement status" |
| **Total final earned amount** | commission_amount | ยอดสุทธิรายได้ (ใช้คำนวณ); แมปเฉพาะหัวนี้ |
| **Est. standard commission** | standard_commission | เมื่อแถวเป็น Ineligible ใช้ค่านี้เป็น "ยอดที่ขาดรายได้ไป" (Total final earned amount มักไม่มีค่า) |
| Order date | order_date | วันที่สั่งซื้อ |
| GMV (ถ้ามี) | gmv | ยอดขาย; ถ้าไม่มีใช้ Price × Items sold |

- **การแมปหัวคอลัมน์:** ใช้เฉพาะเมื่อ **หัวคอลัมน์มีคำ keyword ครบ** (ไม่ให้หัวสั้นเช่น "Status" แย่งแมป "order settlement status"). ตัวเลขจากเซลล์ parse ด้วย `parseNumAffiliate` (ตัด ฿, THB, comma, space) — ดู `file-parser.ts`.

### กฎรายได้และยอดที่ไม่ได้รับ

- **ยอดรายได้ที่นำมาคิด:** รวมเฉพาะแถวที่ Order settlement status **ไม่ใช่** Ineligible. ใช้ค่าจาก Total final earned amount.
- **ยอดที่ไม่ได้รับ (Ineligible):** แถวที่ status = Ineligible ใช้ **Est. standard commission** เป็นยอด (เพราะ Total final earned amount มักไม่มีค่า). นำไปรวมใน byStatus, ยอดที่ขาดรายได้ไปต่อร้าน, และรายสินค้า (สินค้าตัวไหนที่ทำให้ขาดรายได้ไป).

### สรุปหลัง Process (UI)

1. **การ์ดสรุป (3 การ์ด):** ยอดรายได้ที่นำมาคิด (totalEligibleCommission), Settled (จ่ายแล้ว), Ineligible (ไม่ได้รับ) + สัดส่วน %.
2. **Commission Rate เฉลี่ย (รวม)** + คำใบ้ "ถ้า Ineligible กลายเป็น Settled ได้ทั้งหมด จะได้เพิ่มอีกประมาณ X บาท".
3. **กราฟร้านค้าที่ทำเงิน (Stacked bar):** แกน Y = ร้าน (15 ร้านที่ค่าคอมสูงสุด). แท่งแนวนอนซ้อน 3 ส่วน: ยอดขาย (GMV), ยอดรายได้จริง, ค่าคอมที่หายไป. ความกว้างขั้นต่ำของแท่ง 28% เพื่อให้ร้านยอดน้อยอ่านได้. โฮเวอร์ที่แถว = แสดงกล่องสรุปยอด 3 ค่า.
4. **ตารางร้าน:** คอลัมน์ — ร้านค้า (มีไอคอน Chevron ขยาย/ย่อ), จำนวน order, ยอดขาย, ค่าคอมที่ได้, ยอดที่ขาดรายได้ไป, Commission Rate เฉลี่ย (รายร้าน), % ของยอดรายได้. **Collapse/expand:** คลิกแถวร้าน = ขยายแสดงรายการสินค้าในร้านใต้แถวนั้น (drill-down แบบ inline).
5. **รายการสินค้าในร้าน (เมื่อขยาย):** แสดงเป็น **การ์ด (card)** ไม่ใช่ตาราง. Grid responsive: 1 คอลัมน์ (มือถือ), 2–3 คอลัมน์ (จอใหญ่). แต่ละการ์ดแสดง: ชื่อสินค้า (คลิกเพื่อดูชื่อเต็ม/ย่อ), SKU, จำนวนขาย, ยอดขาย, ค่าคอมที่ได้, **ค่าคอมที่ขาดรายได้ไป (รายตัว)** — ว่าสินค้าตัวไหนที่ทำให้ขาดรายได้ไป; ตารางหลักของร้านคือ **ผลรวม** ของร้าน.

### โครงข้อมูล (Affiliate)

- **AffiliateShopSummary:** shopName, amount (ยอดรายได้ที่นำมาคิด), gmv, orderCount, ineligibleAmount, ratio.
- **AffiliateProductSummary:** shopName, productName, skuId, itemsSold, gmv, commission, **ineligibleAmount** (รายสินค้า), rate.
- **AffiliateSummary:** totalCommission, totalEligibleCommission, avgCommissionRate, byStatus, byShop, products, potentialGainIfIneligibleSettled.

### โค้ดหลัก (Affiliate)

- `file-parser.ts`: AFFILIATE_FIELDS, AFFILIATE_HEADER_KEYWORDS (แมปเฉพาะคำที่ตรง), parseNumAffiliate, aggregateAffiliateOrders (รวม ineligibleAmount รายร้านและรายสินค้า).
- `ImportWizard.tsx`: ผลลัพธ์ Affiliate (การ์ด, กราฟ CSS stacked bar, ตารางร้าน + collapse, การ์ดสินค้า, state chartHoverShop / expandedProductTitleKey).
