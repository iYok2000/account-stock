# Feature Spec — Inventory (สินค้าคงคลัง)

สรุปฟีเจอร์จากโค้ด

---

## Research: ความต้องการขั้นต่ำของเจ้าของร้าน (TikTok Shop / Shopee)

จาก research ความต้องการขั้นต่ำที่ seller ใช้จริง:

- **เห็นภาพรวมสต็อกทันที** — จำนวนสินค้าทั้งหมด, มีกี่รายการสต็อกต่ำ, กี่รายการหมด (dashboard/summary ด้านบน)
- **แจ้งเตือนสต็อกต่ำ** — ให้โฟกัสได้ว่าต้องเติมอะไรก่อน (filter/chip "สต็อกต่ำ", "หมด")
- **แก้จำนวนเร็ว** — อัปเดตจำนวนในตารางได้เลย ไม่ต้องเปิดฟอร์มเต็ม (inline edit qty)
- **ค้นหา/กรองง่าย** — ค้นชื่อ/SKU, กรองสถานะ (รวมปุ่มกดด่วนเช่น "สต็อกต่ำ")
- **ไม่ขายเกินสต็อก** — จำนวนชัดเจน, สถานะสี (เขียว/เหลือง/แดง)
- **รายการแรกไม่ยาก** — หน้า empty state ชวนเพิ่มสินค้าแรก, ฟอร์มเพิ่มไม่ยาวเกิน

ดังนั้น UI ควรมี: **summary ด้านบน** (ทั้งหมด / สต็อกต่ำ / หมด), **quick filter** (ทั้งหมด | สต็อกต่ำ | หมด), **แก้จำนวนในแถวได้เลย**, **empty state เป็นมิตร + CTA เพิ่มสินค้าแรก**.

---

## Route & Permission

- **Route:** `/[locale]/inventory`
- **Permission:** `inventory:read` (เห็นเมนู), `inventory:create`, `inventory:update`, `inventory:delete`, `inventory:export` (ปุ่ม/action ตาม RBAC)

---

## ฟีเจอร์หลัก (จากโค้ด)

### 1. Summary Strip (ภาพรวมสต็อก)
- การ์ด 3 ช่อง: **สินค้าทั้งหมด** / **สต็อกต่ำ** / **หมดสต็อก** (คำนวณจาก items)
- ใช้สี amber/red เบาเพื่อดึงสายตาเรื่องสต็อกต่ำ–หมด

### 2. Page Header
- หัวข้อ: title (i18n: `inventory.title`)
- ปุ่ม **เพิ่มสินค้า** — แสดงเฉพาะเมื่อ `can("inventory:create")`

### 3. Filter Bar
- **Search:** input type search, placeholder จาก i18n
- **Filter สถานะ:** select (filterStatus)
- **Filter หมวด:** select (filterCategory)
- ยังไม่ผูก state/API

### 4. Quick Filter Chips
- ปุ่ม: **ทั้งหมด** | **สต็อกต่ำ** | **หมด** — กรองรายการในตารางตามสถานะ (หนึ่งแตะ)

### 5. Bulk Actions Bar (แสดงเมื่อมีรายการที่เลือก)
- แสดงเมื่อ `someSelected && (can("inventory:update") || can("inventory:export"))`
- ข้อความ "X selected"
- **สั่งซื้อใหม่ (bulkReorder)** — แสดงเมื่อ `can("inventory:update")`, ปัจจุบัน disabled  
  - **ทำอะไร:** เลือกหลายรายการ (เช่น สินค้าสต็อกต่ำ/หมด) แล้วกดเพื่อสร้างคำสั่งซื้อเติมสต็อก (replenishment)
  - **เชื่อมกับ:** เมนู **Orders (คำสั่งซื้อ)** — เปิดฟอร์มสร้าง order โดยเติมรายการที่เลือกเป็น line items (หรือ redirect ไปหน้า Place Order พร้อมรายการที่เลือก)
- **ส่งออก (bulkExport)** — แสดงเมื่อ `can("inventory:export")`, ปัจจุบัน disabled  
  - **ทำอะไร:** export รายการที่เลือกเป็นไฟล์ (CSV/Excel) สำหรับ backup, นำไปใช้ในรายงาน หรือนำกลับเข้า system อื่น
  - **เชื่อมกับ:** ไม่ต้องไปเมนูอื่น — ดาวน์โหลดไฟล์ตรงนี้; รูปแบบส่งออกอาจใช้ร่วมกับ **Import (นำเข้าข้อมูล)** ได้ (export แล้วแก้แล้ว import กลับ)

### 6. Empty State (เมื่อไม่มีสินค้า)
- ไอคอน + หัวข้อ `inventory.empty` + คำอธิบาย `inventory.emptyDescription`
- ปุ่ม CTA **เพิ่มสินค้าแรก** → เปิด Form เพิ่มสินค้า (เมื่อ `can("inventory:create")`)

### 7. ตารางสินค้า
- **คอลัมน์:** Checkbox (select all / per row), ชื่อ, SKU, **จำนวน (แก้ในแถวได้เลย — NumberInput)**, สถานะ, Actions
- **Checkbox:** เลือกทั้งหมด / เลือกทีละแถว (ตาม filteredItems)
- **จำนวน:** แก้ในแถวได้ (stepper + พิมพ์). **กดบันทึกก่อนถึงจะ commit** — พิมพ์หรือ +/- เป็น draft; แถวที่แก้จะถูกเช็ค (checkbox) อัตโนมัติ. Blur ไม่ commit อัตโนมัติ.
- **แถบรวม บันทึก/ยกเลิก:** เมื่อมีรายการที่เลือกและมีค่าแก้ (ต่างจากเดิม) แสดงแถบเดียว: "X รายการที่แก้ไข" + **บันทึกการแก้ไข** **ยกเลิกการแก้ไข**. บันทึก = commit เฉพาะแถวที่เลือกและมีค่าเปลี่ยน (ค่าเดิมไม่ส่ง). ยกเลิก = ทิ้ง draft และเอาแถวที่แก้ออกจาก selection.
- **สถานะ:** StatusTag (อัปเดตเมื่อกดบันทึก: 0=หมด, 1–5=สต็อกต่ำ, 6+=ปกติ)
- **Actions ต่อแถว:**
  - **แก้ไข** — ใช้เมื่อต้องการแก้ **ข้อมูลเต็ม** ของสินค้า (ชื่อ, SKU, จำนวน, สถานะ ฯลฯ) ใน modal เดียว; ต่างจากแค่แก้จำนวนในแถวที่ทำได้อยู่แล้ว. ปัจจุบันยังไม่มี modal (placeholder; แสดงเมื่อ `can("inventory:update")`).
  - ลบ (ConfirmModal)
- เมื่อกรองแล้วไม่มีรายการ: แสดงข้อความ `inventory.noFilterMatch`

### 8. Modal — เพิ่มสินค้า (FormModal)
- **ฟิลด์:** ชื่อ (text), SKU (text), จำนวน (NumberInput — stepper + พิมพ์ได้), สถานะ (select: in_stock, low_stock, out_of_stock)
- Validation: ชื่อ/SKU/จำนวน required; จำนวนต้องเป็นตัวเลข ≥ 0
- ปุ่ม: ยกเลิก, บันทึก (submit loading)
- ปัจจุบัน: dev-only mock submit (setTimeout + toast) จนกว่าต่อ API

### 9. Modal — ยืนยันลบ (ConfirmModal)
- ข้อความยืนยัน, ปุ่มลบ (danger), loading state
- ปัจจุบัน: dev-only mock delete + toast จนกว่าต่อ API

---

## State (Client)

- `items` (รายการสินค้า; empty state จนต่อ API — ถ้ามี demo data เป็น dev-only ชั่วคราว)
- `selected` (Set<number>), `quickFilter` ('all' | 'low_stock' | 'out_of_stock'), `addItemOpen`, `deleteConfirmOpen`, `deleteTargetId`, `submitLoading`, `formErrors`, `form`
- สถานะ derive จาก qty: 0 → out_of_stock, 1–5 → low_stock, 6+ → in_stock (LOW_STOCK_THRESHOLD = 5)

---

## ไฟล์ที่เกี่ยวข้อง

- `app/[locale]/inventory/page.tsx` — หน้า (client, render InventoryContent)
- `components/inventory/InventoryContent.tsx` — เนื้อหาทั้งหมด (client)
- `components/ui/NumberInput.tsx` — ช่องจำนวน (stepper + พิมพ์)
- `components/ui/Modal.tsx` — FormModal, ConfirmModal
- `components/ui/StatusTag.tsx` — แสดงสถานะ
