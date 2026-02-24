# Feature Spec — Import (นำเข้าข้อมูล)

Phase 1: Order Transaction only — อัปโหลด CSV/XLSX → ระบบทำ mapping + clean + prepare + parse (user รอ) → Process → ยอดขายตาม SKU + รายได้ → บันทึกลง DB (ไม่เก็บไฟล์)

---

## Route & Permission

- **Route:** `/[locale]/import`
- **Permission:** ตาม NAV_PERMISSIONS ในโปรเจกต์ (ปัจจุบัน map `/import` → `inventory:create` ใน `lib/rbac/constants.ts`)

---

## User context

Import ใช้ **user context ตาม [docs/USER_SPEC.md](../USER_SPEC.md)** (role, tier, company): ตรวจสิทธิ์ใช้ role; การบันทึก/GET ใช้ tier และ scope ตาม company_id เสมอ

---

## รูปแบบไฟล์ & ขนาด

- **รูปแบบ:** CSV, XLSX
- **ขนาด:** สูงสุด **3.5 MB** ต่อไฟล์ (ตรวจที่ FileDropzone + parseFile)
- **จำนวนแถว:** สูงสุด **50,000** แถวข้อมูล (ไม่รวม header)
- **ประเภทข้อมูล (Phase 1):** **Order Transaction** เท่านั้น (Income / สินค้าคงคลัง รองรับใน Phase ถัดไป)

---

## Flow หลังอัปโหลด (user รออย่างเดียว)

หลัง user อัปโหลดไฟล์แล้ว ระบบทำทั้งหมดโดยอัตโนมัติ:

1. **เลือก field (mapping):** ระบบ map header ในไฟล์ → ฟิลด์เป้าหมาย Order Transaction (auto-detect จากชื่อ column)
2. **Clean / Prepare / Parser:** ทำความสะอาด (ค่าว่าง, trim), แปลงตัวเลข/วันที่, **parser ค่าว่าง** (จัดการ cell ว่าง — ข้ามหรือใส่ default ตามประเภทฟิลด์)
3. User ไม่ต้องกด map เอง — ระบบ map ให้ (หรือให้แก้ mapping ได้ถ้าต้องการ)
4. **กด Process** → ระบบรวม/คำนวณตาม **tier** (ฟรี: สรุปยอด + แจกแจงหัก + สรุปเป็นวัน; เสียเงิน: สรุป + 1 SKU = 1 record) → บันทึกลง DB ตามระดับ (ฟรี: summary + daily; เสียเงิน: summary + sku rows)
5. **ไม่เก็บไฟล์** — ใช้แค่ประมวลผลแล้วทิ้ง

---

## Column Mapper — ฟิลด์เป้าหมาย Order Transaction (60 ฟิลด์)

ฟิลด์ที่รองรับสำหรับ map จาก header ในไฟล์ (ตรงกับ `ORDER_TRANSACTION_FIELDS` ใน `file-parser.ts`):

Order ID, Order Status, Order Substatus, Cancelation/Return Type, Normal or Pre-order, SKU ID, Seller SKU, Product Name, Variation, Quantity, Sku Quantity of return, SKU Unit Original Price, SKU Subtotal Before Discount, SKU Platform Discount, SKU Seller Discount, SKU Subtotal After Discount, Shipping Fee After Discount, Original Shipping Fee, Shipping Fee Seller Discount, Shipping Fee Platform Discount, Payment platform discount, Taxes, Small Order Fee, Order Amount, Order Refund Amount, Created Time, Paid Time *(ไม่ใช้ใน Phase 1)*, RTS Time, Shipped Time, Delivered Time, Cancelled Time, Cancel By, Cancel Reason, Fulfillment Type, Warehouse Name, Tracking ID, Delivery Option, Shipping Provider Name, Buyer Message, Buyer Username, Recipient, Phone #, Zipcode, Country, Province, District, Detail Address, Additional address information, Payment Method, Weight(kg), Product Category, Package ID, Seller Note, Checked Status, Checked Marked by

---

## ฟิลด์: จำเป็น vs เลือกใช้ + Data processing (สรุปจาก GPT research)

### ความจำเป็นต่อผลลัพธ์ "ยอดขายตาม SKU + รายได้" (ทีละฟิลด์)

| ฟิลด์ | ระดับ | ใช้ทำอะไร | Data processing แนะนำ |
|--------|--------|-----------|------------------------|
| Order ID | จำเป็น | Key สำหรับจัดกลุ่ม transaction | Trim; ตรวจสอบไม่ว่าง; format สม่ำเสมอ |
| Order Status | เลือกใช้ | กรอง/แสดงสถานะ | Trim; standardize ค่า |
| Order Substatus | เลือกใช้ | สถานะย่อย (ถ้าต้องการ) | Trim |
| Cancelation/Return Type | จำเป็น | ระบุเหตุผลคืน/หัก | Trim; standardize คำ |
| Normal or Pre-order | เลือกใช้ | กรอง/แสดง (ถ้าต้องการ) | Trim; normalize |
| SKU ID | จำเป็น | **Unique ID** — ใช้เป็น key รวมยอดและเป็น identifier ของแถว per-SKU (1 SKU = 1 record) | Trim; validate; ไม่ว่าง |
| Seller SKU | เลือกใช้ | แสดง (รหัส/ชื่อที่ผู้ขายใช้) | Trim |
| Product Name | เลือกใช้ | แสดงชื่อสินค้า | Trim |
| Variation | เลือกใช้ | แสดง/กรองตัวเลือก | Trim |
| Quantity | จำเป็น | คำนวณจำนวนหน่วยขาย | Parse integer; ว่าง/ผิดรูปแบบ → 0 |
| Sku Quantity of return | จำเป็น | คำนวณจำนวนหน่วยคืน | Parse integer; default 0 |
| SKU Unit Original Price | จำเป็น | ราคาต้นทางสำหรับคำนวณรายได้ | Parse float; รองรับ locale ทศนิยม |
| SKU Subtotal Before Discount | จำเป็น | ตรวจสอบความถูกต้องการคำนวณ | Parse float |
| SKU Platform Discount | จำเป็น | หักส่วนลดแพลตฟอร์ม | Parse float; ว่าง → 0 |
| SKU Seller Discount | จำเป็น | หักส่วนลดผู้ขาย | Parse float; ว่าง → 0 |
| SKU Subtotal After Discount | จำเป็น | รายได้หลังหักส่วนลด | Parse float |
| Shipping Fee After Discount | เลือกใช้ | แสดง/คำนวณส่วนร่วมค่าขนส่ง | Parse float |
| Original Shipping Fee | เลือกใช้ | อ้างอิง/แสดง | Parse float |
| Shipping Fee Seller Discount | เลือกใช้ | แหล่งส่วนลด (ถ้าต้องการ) | Parse float |
| Shipping Fee Platform Discount | เลือกใช้ | แหล่งส่วนลด (ถ้าต้องการ) | Parse float |
| Payment platform discount | จำเป็น | หักส่วนลดชำระเงิน | Parse float |
| Taxes | จำเป็น | ภาษีสำหรับคำนวณรายได้ | Parse float |
| Small Order Fee | เลือกใช้ | รายละเอียดค่าธรรมเนียม (ถ้าต้องการ) | Parse float |
| Order Amount | จำเป็น | ยอดรวม order | Parse float |
| Order Refund Amount | จำเป็น | ยอดคืนรวม | Parse float |
| Created Time | เลือกใช้ | กรอง/แสดงตามเวลา; ใช้เป็นวันที่สำหรับสรุปและ upsert | Parse datetime (ISO); รองรับ timezone |
| Paid Time | **ตัดออกใน Phase 1** | ไม่ใช้ | — |
| RTS Time | ไม่ใช้ใน Phase 1 | ไม่เกี่ยวกับการรวมยอด | — |
| Shipped Time | เลือกใช้ | กรอง/ติดตาม (ถ้าต้องการ) | Parse datetime |
| Delivered Time | เลือกใช้ | กรอง/แสดง | Parse datetime |
| Cancelled Time | เลือกใช้ | รายงานยกเลิก (ถ้าต้องการ) | Parse datetime |
| Cancel By | เลือกใช้ | แสดงเหตุผลยกเลิก | Trim |
| Cancel Reason | เลือกใช้ | แสดงเหตุผลยกเลิก | Trim |
| Fulfillment Type | เลือกใช้ | แสดง/กรอง | Trim |
| Warehouse Name | เลือกใช้ | กรอง/แสดง | Trim |
| Tracking ID | เลือกใช้ | กรอง/ติดตาม | Trim |
| Delivery Option | เลือกใช้ | กรอง/แสดง | Trim |
| Shipping Provider Name | เลือกใช้ | แสดง/กรอง | Trim |
| Buyer Message | ไม่ใช้ใน Phase 1 | ไม่ใช้ในการรวมยอด | — |
| Buyer Username | เลือกใช้ | กรอง/แสดง (ถ้าต้องการ) | Trim |
| Recipient | เลือกใช้ | แสดง (ถ้าต้องการ) | Trim |
| Phone # | ไม่ใช้ใน Phase 1 | ไม่เกี่ยวข้อง | — |
| Zipcode | ไม่ใช้ใน Phase 1 | อยู่นอกขอบเขต Phase 1 | — |
| Country | เลือกใช้ | กรองภูมิศาสตร์ (ถ้าต้องการ) | Trim |
| Province | เลือกใช้ | กรองภูมิศาสตร์ (ถ้าต้องการ) | Trim |
| District | เลือกใช้ | กรองภูมิศาสตร์ (ถ้าต้องการ) | Trim |
| Detail Address | ไม่ใช้ใน Phase 1 | ไม่ใช้ในการรวม | — |
| Additional address information | ไม่ใช้ใน Phase 1 | ไม่ใช้ในการรวม | — |
| Payment Method | เลือกใช้ | กรอง/แสดง | Trim |
| Weight(kg) | เลือกใช้ | วิเคราะห์ (ถ้าต้องการ) | Parse float |
| Product Category | เลือกใช้ | กรอง/แสดง | Trim |
| Package ID | เลือกใช้ | แสดง/กรอง | Trim |
| Seller Note | ไม่ใช้ใน Phase 1 | ไม่ใช้ | — |
| Checked Status | ไม่ใช้ใน Phase 1 | ไม่ใช้ | — |
| Checked Marked by | ไม่ใช้ใน Phase 1 | ไม่ใช้ | — |

### ขั้นตอน Clean / Prepare / Parse (ทั่วไป)

- **Trim:** ตัดช่องว่างหัวท้ายทุกฟิลด์ข้อความ
- **ค่าว่าง:** ฟิลด์ตัวเลขที่ว่างหรือไม่ใช่ตัวเลข → 0 เมื่อสมเหตุสมผล (ส่วนลด, จำนวน); ฟิลด์ข้อความ → null หรือ "" ตามกฎ
- **ตัวเลข:** Parse เป็น float/integer; รองรับ locale ทศนิยม (comma vs dot) ถ้าจำเป็น
- **วันที่:** Parse เป็นรูปแบบเดียวกัน (แนะนำ ISO8601); รองรับ timezone ถ้ามี; บันทึกหรือแจ้งถ้า parse ไม่ได้
- **Validation:** ตรวจสอบฟิลด์สำคัญ (Order ID, SKU ID) ไม่ว่างและรูปแบบถูกต้อง
- **สกุลเงิน/Locale:** ใช้รูปแบบสกุลเงินและ locale สม่ำเสมอในฟิลด์ตัวเลข
- **ความปลอดภัย:** กัน CSV injection (ทำแล้วใน parser); sanitize ข้อความถ้าเก็บลง DB

---

## ผลลัพธ์ที่ user ต้องการ: ยอดขายตาม SKU และรายได้

- **แต่ละ SKU ขายได้กี่บาท** — รายได้ต่อ SKU
- **โดนหักค่าอะไรบ้าง** — ส่วนลด, ค่าขนส่ง, ภาษี, ค่าธรรมเนียม
- **คืนเท่าไหร่** — ยอดคืน
- **เพื่อรับรู้รายได้** — รายได้สุทธิต่อ SKU หรือรวม

### ฟิลด์ที่สนใจและนำไปใช้

| วัตถุประสงค์ | ฟิลด์ที่ใช้ | การนำไปใช้ |
|--------------|-------------|------------|
| **Unique ID / กลุ่มตาม SKU** | **SKU ID** | ใช้เป็น unique id สำหรับรวมยอดและสำหรับ 1 record ต่อ 1 SKU |
| แสดง | Seller SKU, Product Name, Variation | แสดงรหัส/ชื่อสินค้าในรายงาน |
| รายได้ต่อ SKU | SKU Subtotal After Discount, Quantity | ยอดขายหลังหักส่วนลด; รวมตาม SKU ID |
| ส่วนลดที่หัก (SKU) | SKU Platform Discount, SKU Seller Discount | รวมส่วนลดที่หักต่อ SKU |
| หักอื่นๆ (order-level) | Shipping Fee, Payment platform discount, Taxes, Small Order Fee | แบ่งต่อ SKU ตามกฎ (ดูหัวข้อ "การแบ่ง Shipping/Taxes") |
| คืน | Order Refund Amount, Sku Quantity of return | ยอดคืน; จำนวนชิ้นคืน |
| ยอด order / วันที่ | Order Amount, Order ID, Created Time | สรุปรวม, ช่วงวันที่ (ไม่ใช้ Paid Time ใน Phase 1) |
| สถานะ | Order Status, Order Substatus, Cancelation/Return Type | กรอง order ที่นับเป็นยอดขาย/คืน (ถ้าต้องการ) |

### การแบ่ง Shipping / Taxes ต่อ SKU (ข้อตัดสินใจ)

ค่าขนส่ง ภาษี ค่าธรรมเนียมเล็ก (Small Order Fee) ส่วนลดชำระเงิน (Payment platform discount) มักเป็น **ต่อ order** ไม่ใช่ต่อบรรทัด — หนึ่ง order มีหลายบรรทัด (หลาย SKU) จึงต้องตัดสินใจว่าจะแบ่งให้แต่ละ SKU อย่างไร

| วิธี | รายละเอียด | ข้อดี / ข้อเสีย |
|------|-------------|------------------|
| **A. แบ่งตามสัดส่วนยอด (ที่เลือกใช้)** | แบ่ง Shipping / Taxes / Small Order Fee / Payment platform discount ตามสัดส่วน **SKU Subtotal After Discount** ของแต่ละบรรทัดต่อยอดรวม Subtotal After Discount ของ order นั้น | สะท้อนต้นทุนจริงต่อหน่วยขายได้ดี; ใช้บ่อยในรายงานต้นทุนต่อ SKU |
| **B. แบ่งเท่ากัน** | แบ่งเท่ากันตามจำนวนบรรทัด (จำนวน SKU) ใน order | ง่าย; แต่สินค้าราคาสูงอาจได้ส่วนแบ่งเท่ากับราคาต่ำ ไม่สะท้อนสัดส่วนจริง |
| **C. ไม่แบ่ง (เก็บระดับ order)** | เก็บ shipping/taxes เป็นยอดรวมใน **summary** อย่างเดียว ไม่ใส่ในรายการ per-SKU; แต่ละแถว per-SKU มีแค่รายได้และส่วนลดระดับ SKU (Platform/Seller Discount) | ง่ายที่สุด; รายได้สุทธิต่อ SKU จะไม่รวม "ส่วนแบ่ง" ค่าขนส่ง/ภาษี — ถ้าต้องการรายได้สุทธิต่อ SKU ที่รวมต้นทุนขนส่ง/ภาษี ต้องใช้ A หรือ B |

**ข้อตัดสินใจ: ใช้ A (แบ่งตามสัดส่วนยอด)** — Phase 1 ใช้วิธี A เพื่อให้รายได้สุทธิต่อ SKU สมเหตุสมผล

สูตร A: ต่อหนึ่ง order — `ส่วนแบ่งของ SKU k = (Shipping + Taxes + ...) * (SKU k Subtotal After Discount / sum(Subtotal After Discount ของทุกบรรทัดใน order))`

### ขั้นตอนประมวลผล (เพื่อผลลัพธ์ตรงกับที่ user อยากเห็น)

1. **Clean / Prepare:** ค่าว่าง → trim; ตัวเลข (Quantity, ราคา, ส่วนลด) → parse เป็น number; วันที่ → parse เป็น date
2. **Map column → 60 ฟิลด์:** Auto-detect จาก header name (ให้ user แก้ mapping ได้ถ้าชื่อไม่ตรง)
3. **กรองแถว (ถ้าต้องการ):** เช่น เฉพาะ Order Status = Delivered/Paid
4. **Group by SKU ID** (ใช้ SKU ID เป็น unique id); แสดง Seller SKU, Product Name, Variation ใน output
5. **ต่อกลุ่ม (per SKU) คำนวณ:** รายได้ (sum SKU Subtotal After Discount), หักระดับ SKU (Platform/Seller Discount), หักระดับ order ที่แบ่งตามสัดส่วน (Shipping, Taxes, Small Order Fee, Payment platform discount — ตามวิธีที่เลือก), คืน (Order Refund Amount / Sku Quantity of return), รายได้สุทธิ
6. **Output:** ตามระดับ (ฟรี vs เสียเงิน) — ดูหัวข้อ "สองระดับ: ฟรี vs เสียเงิน"

---

## สองระดับ: ฟรี vs เสียเงิน (ออกแบบรองรับทั้งสองแต่แรก)

ผลลัพธ์แบ่งเป็น **2 ระดับ** — ระดับฟรีและระดับเสียเงิน ต้องออกแบบ schema / payload / API ให้รองรับทั้งสองระดับตั้งแต่แรก

| ระดับ | ผลลัพธ์ที่ได้ | รายละเอียด |
|--------|----------------|-------------|
| **ระดับฟรี** | สรุปยอดทั้งหมด + แจกแจงการหักต่างๆ + **สรุปเป็นวัน** | ยอดรวม; แยกประเภทหัก (Platform Discount, Seller Discount, Shipping, Taxes, Small Order Fee, Payment discount ฯลฯ); สรุปตาม **วัน** (daily summary) — ไม่มีรายการ per-SKU |
| **ระดับเสียเงิน** | สรุปยอด + **1 SKU = 1 record** | นอกเหนือจากสรุปแล้ว มีรายการ **ต่อ SKU** — สินค้าชิ้นไหน ขายได้เท่าไหร่ หักอะไร คืนเท่าไหร่ **มีความสามารถแบบไหน** (รายละเอียด/ความสามารถต่อสินค้า) ละเอียดกว่า |

### ออกแบบให้รองรับทั้งสองระดับแต่แรก

- **Payload:** ส่ง `tier: "free" | "paid"` (หรือ backend ตรวจจาก subscription/สิทธิ์ user)
- **ระดับฟรี:** Client คำนวณสรุปยอด + แจกแจงหัก + **สรุปเป็นวัน** (daily); ส่ง `summary` + `daily` (array ของ { date, revenue, deductions_breakdown, refund, net ฯลฯ }). Backend เก็บ `import_summary` + **`import_daily`** (1 แถวต่อวันต่อครั้ง import); **ไม่เก็บ** `import_sku_row`
- **ระดับเสียเงิน:** Client คำนวณสรุป + **per-SKU (1 SKU = 1 record)** พร้อมฟิลด์ความสามารถ/รายละเอียด; ส่ง `summary` + `items` (array ของ object ต่อ SKU: sku_id, seller_sku, product_name, variation, quantity, revenue, deductions, refund, net, **capability / รายละเอียด** ฯลฯ). Backend เก็บ `import_summary` + **`import_sku_row`** (1 แถวต่อ 1 SKU; มีคอลัมน์สำหรับความสามารถ/รายละเอียดต่อสินค้า)
- **Schema DB:** กำหนดตารางทั้งสามแต่แรก — `import_summary` (ร่วมทั้งสองระดับ), `import_daily` (ใช้เมื่อ tier = free), `import_sku_row` (ใช้เมื่อ tier = paid) — เพื่อไม่ต้องเปลี่ยน schema ทีหลัง

*(ฟิลด์ "ความสามารถ" / capability ต่อ SKU ในระดับเสียเงิน — รายละเอียดว่าจะเก็บอะไร เช่น สรุปคุณสมบัติขายได้/หัก/คืน หรือตัวชี้วัดอื่น กำหนดใน Phase ถัดไป)*

### หลัง Process: Upsert (ซ้ำแล้วอัปเดต) + import_summary แยกระดับวัน

**ปัญหา:** User อาจจำไม่ได้ว่าไฟล์นี้ import ไปแล้วหรือยัง หรือรายการนี้ซ้ำ/เคย process ไปแล้ว

**วิธีแก้:** ใช้ **upsert** — ถ้า **วันที่** (และระดับ paid: **วันที่ + sku_id**) ซ้ำกับที่มีอยู่แล้ว ให้ **อัปเดตของเดิม** (ไม่ insert ซ้ำ)

- **ตาราง `import_summary` แยกเป็นระดับวัน** — เก็บสรุป **ต่อวัน** ต่อ **company** (1 แถวต่อ company ต่อวัน); key สำหรับ upsert = **(company_id, date)** (จาก user context)
- **ระดับฟรี:** Upsert ตาม **(company_id, date)** — ถ้ามีสรุปของเจ้านั้นในวันนั้นแล้ว → update แถวเดิม; `import_daily` ก็ scope company_id และอ้างอิงวัน
- **ระดับเสียเงิน:** Upsert ตาม **(company_id, date, sku_id)** — ถ้ามีแถว (เจ้านั้น + วันนั้น + sku_id นั้น) อยู่แล้ว → update แถวเดิมใน `import_sku_row`; ไม่สร้างแถวซ้ำ

*(กำหนดให้ทุก record มีฟิลด์ date จากข้อมูลที่ import เช่น จาก Created Time หรือช่วงวันที่ของไฟล์)*

### การ GET ข้อมูล (ดึงมาดู)

- **Scope:** ดึงข้อมูล **เฉพาะของ company ที่ user ล็อกอินอยู่** (จาก user context — role, tier, company)
- **ระดับที่ได้ตาม tier:**

| Tier | ระดับที่ได้ |
|------|-------------|
| **ฟรี** | **ระดับเดือนเท่านั้น** — ตอน get มาได้เฉพาะสรุปรวมเป็นเดือน |
| **เสียเงิน** | **เลือกได้** — ระดับวัน หรือ ระดับเดือน (ส่ง query param เช่น `granularity=day|month`) |

---

## ผลลัพธ์หลังนำเข้า — แสดงที่เมนูไหน

- **ทันทีหลัง Process:** ผลลัพธ์ (สรุปยอด, สรุปตามวัน หรือรายการตาม SKU) แสดงในขั้น **Result** ของวิซาร์ดในหน้า **นำเข้าข้อมูล** (`/[locale]/import`) เท่านั้น
- **ดูข้อมูลที่บันทึกแล้ว (ภายหลัง):** Backend มี GET endpoint สำหรับดึงข้อมูลที่บันทึกจาก import (ตาม company_id, tier, granularity) — **ฝั่ง frontend ยังไม่ได้กำหนดเมนูที่ใช้แสดงข้อมูลนี้**  
  **แนะนำ:** ใช้เมนู **รายงาน (Reports)** `/[locale]/reports` เป็นจุดแสดงผลยอดขาย/รายได้จากข้อมูลที่นำเข้า (เรียก GET API แล้วแสดงสรุปรายเดือน หรือรายวัน/ราย SKU ตาม tier) — เมื่อ backend GET พร้อมจึงเชื่อมต่อหน้า Reports กับ API นี้

---

## ขั้นตอน Wizard (Phase 1)

1. **เลือกประเภท:** แสดงเฉพาะ **Order Transaction**
2. **อัปโหลด:** รับ CSV/XLSX สูงสุด 3.5 MB → parse → ระบบทำ mapping (auto) + clean + prepare + parser ค่าว่าง → แสดง mapping + preview (แก้ได้)
3. **Process:** กด Process → ตาม tier (ฟรี: สรุปยอด + แจกแจงหัก + สรุปเป็นวัน; เสียเงิน: สรุป + 1 SKU = 1 record พร้อมความสามารถ/รายละเอียด) → ส่ง payload ตาม tier ไป API (ไม่ส่งไฟล์)
4. **Result:** แสดงผลลัพธ์ตามระดับ; backend บันทึกตาม tier (ฟรี: summary + daily; เสียเงิน: summary + sku rows)

---

## การประมวลผล & API

- **Client:** อ่านไฟล์ → mapping + clean + validate → aggregate ตาม tier (ฟรี: สรุป + daily; เสียเงิน: สรุป + per-SKU) → ส่ง payload มี `tier` + ข้อมูลตามระดับ ไป API
- **API:** รับ payload มี `tier` → ฟรี: INSERT summary + **daily** (1 แถวต่อวัน); เสียเงิน: INSERT summary + **import_sku_row** (1 แถวต่อ 1 SKU); ไม่รับ/ไม่เก็บไฟล์
- **ไม่เก็บไฟล์:** ไม่มี upload ไฟล์ขึ้น server เพื่อเก็บ — อ่านใน browser แล้วทิ้ง

---

## Backend (แยก repo / แยก service)

**งานที่ backend ต้องทำ:** รับ JSON มี `tier` + ข้อมูลตามระดับ (ฟรี: summary + daily; เสียเงิน: summary + items per-SKU), validate, บันทึกลง DB — **ออกแบบรองรับทั้งสองระดับแต่แรก**; ไม่รับไฟล์ ไม่ทำ aggregate ฝั่ง server (ทำที่ client แล้ว)

- **FE เรียก:** `fetch(\`${BASE}/api/import/order-transaction\`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), credentials: "include" })` — โค้ดใช้ `BASE = ""` (same-origin)  
  - **payload tier = "free":** `{ tier: "free", summary, daily }` — summary: { totalRows, totalRevenue, totalRefund, totalDeductions, dateFrom, dateTo }; daily: array ของ { date, revenue, deductions_breakdown, refund, net }  
  - **payload tier = "paid":** `{ tier: "paid", summary, items }` — items: array ของ { sku_id, seller_sku?, product_name?, variation?, quantity, revenue, deductions, refund, net } (capability รองรับใน Phase ถัดไป)
- **Backend:** รับ request มี **user context (role, tier, company_id)** จาก auth → ตรวจสิทธิ์และ tier → validate body → **upsert** scope ตาม **company_id**: ฟรี: upsert `import_summary`(company_id, date) + **`import_daily`**; เสียเงิน: upsert `import_summary`(company_id, date) + **`import_sku_row`**(company_id, date, sku_id) → return 201
- **GET:** Endpoint ดึงข้อมูล — **scope ตาม company_id ของ user** เสมอ; ฟรี: ส่งคืน **ระดับเดือนเท่านั้น**; paid: รับ query เช่น `granularity=day|month` ส่งคืนตามที่เลือก
- **Stack backend (แนะนำ):** **Go (Golang)** — พัฒนาเร็ว, ecosystem ดีสำหรับ HTTP API + DB, deploy ง่าย, ประสิทธิภาพเพียงพอสำหรับ Phase 1; หรือ **Rust** — ประสิทธิภาพสูงและ memory safety ถ้าทีมคุ้นหรือต้องการ performance สูง. ทางเลือกอื่น: Node/Express, Fastify ฯลฯ ตามที่ทีมใช้. DB: PostgreSQL (แนะนำ); ORM/query ตาม stack (Go: sqlx, GORM; Rust: SQLx, Diesel)

---

## ไฟล์ที่เกี่ยวข้อง

**Frontend (repo นี้)**

- `app/[locale]/import/page.tsx` — หน้า import
- `components/upload/ImportWizard.tsx` — วิซาร์ด (select-type → upload → mapping/preview → result); Phase 1 แสดงเฉพาะ Order Transaction; เลือก tier ฟรี/เสียเงิน; Process เรียก aggregateOrderTransaction แล้ว POST `/api/import/order-transaction`
- `components/upload/FileDropzone.tsx` — ลาก/เลือกไฟล์ (max 3.5 MB)
- `components/upload/ColumnMapper.tsx` — map คอลัมน์ (60 ฟิลด์จาก getFieldsForType("order_transaction"))
- `components/upload/DataPreview.tsx` — แสดงตัวอย่างข้อมูลที่ map แล้ว
- `components/upload/file-parser.ts` — parseFile (3.5 MB + 50k rows), ORDER_TRANSACTION_FIELDS (60 ฟิลด์), autoDetectMappings, validateRows, normalizeOrderTransactionRow, aggregateOrderTransaction (formula A; คืน summary + daily + items)

**Backend (repo/service แยก)**

- Endpoint POST `/api/import/order-transaction` — รับ payload มี `tier` + ข้อมูลตามระดับ; validate; ฟรี: INSERT summary + **daily** (1 แถวต่อวัน); เสียเงิน: INSERT summary + **import_sku_row** (1 แถวต่อ 1 SKU)
- Schema DB (รองรับทั้งสองระดับแต่แรก; **ทุกตารางมี `company_id`** สำหรับแยกเจ้า): **`import_summary`** (ระดับวัน — 1 แถวต่อ **company** ต่อวัน; upsert key = company_id + date), **`import_daily`** (1 แถวต่อ company ต่อวัน — tier = free; upsert key = company_id + date), **`import_sku_row`** (1 แถวต่อ company ต่อ date ต่อ SKU — tier = paid; upsert key = company_id + date + sku_id; มีคอลัมน์ความสามารถ/รายละเอียดต่อสินค้า)
