# Feature Spec — Calculator (เครื่องคำนวณกำไร)

สรุปฟีเจอร์จากโค้ด

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
- ต้นทุนแยก (ต้นทุนสินค้า, แพ็ค, จัดส่ง, ค่าชำระเงิน, โฆษณา ฯลฯ)
- กำไรต่อชิ้น, เป้าหมาย (goal), margin
- การประมาณการรายได้ (ต่อเดือน/ปี)
- Cost chart (สัดส่วนต้นทุน), Waterfall chart (profit waterfall)

### 4. Analysis Section (AnalysisSection)
- **Breakeven:** ราคาต่ำสุด, ต้นทุนสูงสุด, return สูงสุดที่ทนได้
- **Sensitivity:** เรียงผลว่าปรับอะไรแล้วส่งผลต่อกำไรมากที่สุด
- **Scenarios:** 3 สถานการณ์ (แย่สุด, คาดการณ์, ดีสุด)
- **Monte Carlo:** จำลอง 500 สถานการณ์สุ่ม, ระดับความเสี่ยง, โอกาสขาดทุน

### 5. Happiness / Goal
- Happiness scores (seller, platform, shipping, customer) + หน้า emoji
- ตั้งเป้ากำไรต่อชิ้น (goal) — ปุ่ม "คำนวณย้อนกลับ" ปรับค่าจาก locked/unlocked sliders

### 6. Data & Engine
- คำนวณฝั่ง client (lib/calculator/engine.ts): calculateLocal, getHappiness, calcBreakEven, calcSensitivity, calcScenarios, calcMonteCarlo
- Fee default จาก constant (COMMISSION, VAT, PAYMENT) — หมายเหตุรอ API สำหรับดึงค่าจริง

---

## ไฟล์ที่เกี่ยวข้อง

- `app/[locale]/calculator/page.tsx` — หน้า (client)
- `components/calculator/SlidersPanel.tsx` — แถบ sliders
- `components/calculator/ResultsPanel.tsx` — ผลลัพธ์
- `components/calculator/AnalysisSection.tsx` — การวิเคราะห์
- `components/ui/Slider.tsx` — slider + พิมพ์ค่าได้
- `lib/calculator/engine.ts` — logic คำนวณ
