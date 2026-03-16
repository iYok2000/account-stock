# Feature Spec — Calculator (เครื่องคำนวณกำไร)

สรุปฟีเจอร์จากโค้ด

**Last Updated:** 2026-03-10
**Status:** Implemented (client-side engine v2)

---

## Research & UX Analysis (จาก GPT Research MCP)

**ที่มา:** เรียก MCP tool `research` (server: project-0-account-stock-fe-mcp) โดยส่งคำอธิบายฟีเจอร์หน้าคำนวณและคำขอให้วิเคราะห์ว่าควร ADD / REMOVE / REORGANIZE อะไร ตามพฤติกรรมผู้ใช้และ best practices สำหรับ seller (TikTok Shop / Shopee). ด้านล่างเป็นสรุปจากผล research และ Final analysis.

---

### สรุปจาก GPT Research MCP

**Additions (ควรเพิ่ม)**
- **โหมด Simple vs Advanced:** สลับโหมดให้คนเริ่มต้นเห็นแค่ input/output หลัก; power user เปิด Advanced ได้
- **Save/Load Scenarios:** บันทึกชุด input แล้วโหลดกลับมาใช้
- **Export / แชร์ผล:** ส่งออกรายงานหรือแชร์สรุป (screenshot/PDF)
- **Alerts & คำแนะนำ:** แจ้งเตือน/คำแนะนำอัตโนมัติ (เช่น "ค่าโฆษณาสูงเมื่อเทียบราคาขาย")
- **Benchmark ตาม marketplace:** แสดงค่าเฉลี่ย/ typical ของบาง input (เช่น return rate, affiliate fee)
- **Input เพิ่ม (ถ้าจำเป็น):** ภาษี, ค่าชำระเงิน (payment gateway), ส่วนลด/โปรโมชัน; ต้นทุนถือสต็อก (inventory holding) ถ้าเกี่ยวข้อง
- **Cash flow / Break-even timeline:** ระบุว่าเมื่อไหร่ถึง break-even (ช่วยวางแผน)
- **Tooltip / Help:** อธิบายสั้นๆ ต่อ slider และ metric (hover) เพื่อช่วยมือใหม่

**Removals / Demotions (ควรลดความเด่นหรือย้าย)**
- **Happiness indicators:** ย้ายไปแท็บรองหรือด้านล่าง — ไม่ใช่ core ของการตัดสินใจทางการเงิน
- **Monte Carlo:** ย้ายไปส่วน "advanced" หรือ panel ที่ย่อได้ (ลดความซับซ้อนที่เห็นครั้งแรก)

**Reorganization (จัดลำดับ/จัดกลุ่มใหม่)**
- **Input ก่อน, layout ชัด:** จัดกลุ่ม input ตามหมวด (Pricing, Costs, Marketing, Returns) แนวตั้งหรือแท็บ
- **ผลหลักเห็นทันที:** กำไรต่อชิ้น, margin, กำไรต่อเดือน อยู่ above the fold พร้อมสี/ตัวเลขใหญ่
- **Charts และ Analysis อยู่ถัดไป:** Cost breakdown, Waterfall, Scenarios อยู่ใต้ผลหลัก
- **Mode toggle อยู่บน:** Simple/Advanced อยู่ใกล้ input
- **Scenario และ Monte Carlo แยกแท็บ/ย่อได้:** ลด cognitive load ตอนแรก

**Missing inputs/outputs (ที่อาจขาด)**
- ต้นทุนถือสต็อก (inventory holding)
- ส่วนลด/โปรโมชัน (expected discount rate)
- ค่าชำระเงิน (payment gateway fee)
- Cash flow timing / break-even timeline

**Trade-offs**
- Simplicity vs Power: โหมด Simple/Advanced ช่วยแบ่งกลุ่มผู้ใช้
- การแสดง advanced (Monte Carlo, Happiness): ซ่อนมากไป power user หาไม่เจอ; เปิดมากไปมือใหม่สับสน
- ความหนาแน่นของ UI: จัดกลุ่ม + ย่อได้ ช่วยลด clutter
- Educational vs Speed: tooltip/คำแนะนำช่วยเรียนรู้แต่อาจชะลอคนที่ต้องการคำตอบเร็ว

---

### Final Analysis (สรุปสุดท้าย — นำไปทำได้เลย)

| หมวด | การดำเนินการ |
|------|----------------|
| **โหมด Simple/Advanced** | เพิ่มสลับโหมด: Simple = ราคา, ต้นทุน, จัดส่ง, (option) คอม/affiliate + ผลหลัก; Advanced = ฟิลด์ครบ + Breakeven + Scenarios + Sensitivity + Monte Carlo |
| **ลำดับหน้า** | 1) Input (จัดกลุ่ม Pricing / Costs / Marketing / Returns) 2) ผลหลัก (กำไรต่อชิ้น, margin, กำไรเดือน) 3) Cost + Waterfall chart 4) Breakeven + Scenarios 5) Sensitivity 6) Monte Carlo (ย่อได้หรือแท็บ "ขั้นสูง") 7) Happiness (ด้านล่างหรือบล็อก "สุขภาพดีล") |
| **Happiness** | เก็บไว้ แต่ **ลดความเด่น** — ย้ายลงใต้ผลหลัก หรือใส่ในบล็อกรอง |
| **Monte Carlo** | เก็บไว้ แต่ **ย้ายไปส่วนขั้นสูง** — accordion หรือแท็บ "การวิเคราะห์ขั้นสูง" |
| **Goal + reverse calc** | เก็บไว้ + **เพิ่มคำอธิบายหนึ่งบรรทัด** ว่า lock ค่าไหน แล้วระบบจะปรับค่าที่ปลดล็อกเพื่อให้ได้เป้ากำไร |
| **Default fee ตาม region** | เมื่อมี API: เลือกประเทศ/ช่องทาง (TikTok US/UK/TH ฯลฯ) แล้วเติม commission/VAT default |
| **Tooltip / คำอธิบาย** | คำอธิบายสั้นใต้หรือ hover ที่ slider/ metric หลัก (ต้นทุนสินค้าต่อชิ้น, ค่าจัดส่งต่อออเดอร์ ฯลฯ) |
| **Export / แชร์** | ปุ่มคัดลอกสรุป หรือส่งออก PDF (ตามความพร้อม) |
| **Save/Load scenario** | บันทึก/โหลดชุด input (ตามความพร้อม) |
| **Input ที่อาจเพิ่ม** | ภาษี, payment fee, ส่วนลด/โปรโมชัน; break-even timeline ถ้าคำนวณได้ |

**คำถามเปิด (สำหรับเก็บข้อมูลต่อ):** สัดส่วนมือใหม่ vs power user, เวลาที่ใช้บนหน้า, ฟีเจอร์ไหนถูกใช้หรือได้ feedback บวก, pain point ที่ผู้ใช้บอก, การใช้บน mobile, ความเป็นไปได้ของการดึง fee จริงจาก TikTok/Shopee, หลายภาษา/ศัพท์ท้องถิ่น

---

## Route & Permission

- **Route:** `/[locale]/calculator`
- **Permission:** (ตาม NAV_PERMISSIONS ในโปรเจกต์ — ถ้ามี calculator:read ใช้ตรงนั้น)

---

## ฟีเจอร์หลัก (จากโค้ด)

### 1. Page Header
- Title, subtitle (i18n: calculator.title, calculator.subtitle)
- Badge: "Local Preview" (คำนวณฝั่ง client, ยังไม่ดึง fee จาก API)

### 2. Sliders Panel (SlidersPanel)
- **Input แต่ละตัว:** Slider + คลิกตัวเลขเพื่อพิมพ์ค่าได้ (hybrid)
- **รายการ:**
  - ราคาป้าย (listPrice), ราคาจริง (sellingPrice)
  - ต้นทุนสินค้า (productCost), จำนวนที่ขาย/เดือน (quantity)
  - ค่าจัดส่ง (shippingCost), ค่า Affiliate (affiliateRate), ค่าโฆษณา (adSpend)
  - ค่าแพ็คของ (packagingCost), อัตราคืนสินค้า (returnRate)
- **Lock ต่อค่า:** ปุ่มล็อค/ปลดล็อค (showLock) — ล็อคแล้วไม่แก้ slider ได้
- **โหมดคำนวณ:** ราคาป้าย vs ราคาจริง (priceMode)
- แสดงส่วนลด (discount %) เมื่อราคาจริง < ราคาป้าย
- หมายเหตุค่าธรรมเนียม (FEE จาก engine)

### 3. Results Panel (ResultsPanel)
- สรุปต้นทุนและกำไรต่อชิ้น
- ต้นทุนแยก: สินค้า, แพ็ค, จัดส่ง (net), Commission+VAT, **Commerce Growth**, **Infrastructure**, Transaction Fee, Affiliate, Voucher, โฆษณา
- กำไรต่อชิ้น, เป้าหมาย (goal)
- **Gross Margin** (ก่อนค่าธรรมเนียม Platform) + **Net Margin** (หลังค่าธรรมเนียมทั้งหมด) — แยกแสดง 2 ค่า
- KPI strip: **Settlement Gap %**, **ROAS** (ถ้ามีโฆษณา), **CAC**
- การประมาณการรายได้ (ต่อเดือน/ปี)
- Cost chart (สัดส่วนต้นทุน รวม Commerce Growth + Infrastructure), Waterfall chart

### 4. Analysis Section (AnalysisSection)
- **Breakeven:** ราคาต่ำสุด, ต้นทุนสูงสุด, return สูงสุดที่ทนได้
- **Sensitivity:** เรียงผลว่าปรับอะไรแล้วส่งผลต่อกำไรมากที่สุด
- **Scenarios:** 3 สถานการณ์ (แย่สุด, คาดการณ์, ดีสุด)
- **Monte Carlo:** จำลอง 500 สถานการณ์สุ่ม, ระดับความเสี่ยง, โอกาสขาดทุน

### 5. Happiness / Goal
- Happiness scores (seller, platform, shipping, customer) + หน้า emoji
- ตั้งเป้ากำไรต่อชิ้น (goal) — ปุ่ม "คำนวณย้อนกลับ" ปรับค่าจาก locked/unlocked sliders

### 6. Data & Engine (v2 — อัพเดท 2026-03-10)

**Fee Constants (`FEE`):**

| Constant         | ค่า (default) | รายละเอียด                                 |
|------------------|---------------|--------------------------------------------|
| `COMMISSION`     | 4.0%          | ค่าคอมมิชชัน (category-specific)           |
| `COMMERCE_GROWTH`| 4.0%          | Commerce Growth Fee (CGF): 2–6.5% ตามหมวด |
| `INFRASTRUCTURE` | 0.44%         | Infrastructure Fee (คงที่)                 |
| `PAYMENT`        | 2.84%         | Transaction Fee (แก้จาก 2.0% → ค่าจริง)   |
| `VAT`            | 7.0%          | VAT คิดบน Commission เท่านั้น             |

**Category Presets (`CATEGORY_RATES`):**

| หมวด          | Commission | Commerce Growth | Total Platform* |
|---------------|-----------|-----------------|-----------------|
| `beauty`      | 6.4%      | 6.5%            | ~16%            |
| `fashion`     | 5.0%      | 5.0%            | ~13.3%          |
| `electronics` | 3.0%      | 3.0%            | ~9.7%           |
| `food`        | 2.0%      | 2.0%            | ~7.3%           |
| `general`     | 4.0%      | 4.0%            | ~11.3%          |

*รวม Infrastructure (0.44%) + Transaction (2.84%) + VAT on Commission

**CalcParams inputs ใหม่ (optional):**
- `commerceGrowthRate` — override Commerce Growth rate
- `infrastructureRate` — override Infrastructure rate
- `voucherSellerCost` — ส่วนที่ผู้ขายออกเองต่อออเดอร์ (฿)
- `platformShippingDiscount` — ค่าส่งที่ TikTok ออกให้ต่อออเดอร์ (฿)

**CalcResult outputs ใหม่:**
- `commerceGrowthPerUnit` / `infrastructurePerUnit` / `voucherCostPerUnit` — fees per unit
- `grossMargin` / `grossProfit` — Gross Margin ก่อนค่าธรรมเนียม Platform
- `settlementGapPct` — (fees + shipping) / revenue แสดงว่า TikTok ดึงไปเท่าไหร่
- `roas` — revenue / adSpend (0 ถ้าไม่มีโฆษณา)
- `cac` — adSpend per effective unit

**Functions:** calculateLocal, getHappiness, calcBreakEven, calcSensitivity, calcScenarios, calcMonteCarlo

**หมายเหตุ:** รอ API สำหรับดึงค่าธรรมเนียมจริงจาก DB ตาม category และ seller tier

### 7. Integration (ใหม่)
- หน้า Calculator สามารถ **ดึงข้อมูลจาก Inventory** ได้แล้ว: เลือก SKU จาก backend inventory (หรือผลนำเข้าล่าสุดเมื่อ backend เชื่อมต่อ) เพื่อเติมราคา/จำนวนอัตโนมัติ
- ผู้ใช้กรอกต้นทุนต่อชิ้นเอง ระบบจะจำไว้ต่อ SKU ในเครื่อง (localStorage) เพื่อใช้ซ้ำ

---

## ไฟล์ที่เกี่ยวข้อง

- `app/[locale]/calculator/page.tsx` — หน้า (client)
- `components/calculator/SlidersPanel.tsx` — แถบ sliders
- `components/calculator/ResultsPanel.tsx` — ผลลัพธ์
- `components/calculator/AnalysisSection.tsx` — การวิเคราะห์
- `components/ui/Slider.tsx` — slider + พิมพ์ค่าได้
- `lib/calculator/engine.ts` — logic คำนวณ
