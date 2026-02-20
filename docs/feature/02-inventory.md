# Feature Spec — Inventory (สินค้าคงคลัง)

สรุปฟีเจอร์จากโค้ด

---

## Route & Permission

- **Route:** `/[locale]/inventory`
- **Permission:** `inventory:read` (เห็นเมนู), `inventory:create`, `inventory:update`, `inventory:delete`, `inventory:export` (ปุ่ม/action ตาม RBAC)

---

## ฟีเจอร์หลัก (จากโค้ด)

### 1. Page Header
- หัวข้อ: title (i18n: `inventory.title`)
- ปุ่ม **เพิ่มสินค้า** — แสดงเฉพาะเมื่อ `can("inventory:create")`

### 2. Filter Bar
- **Search:** input type search, placeholder จาก i18n
- **Filter สถานะ:** select (filterStatus)
- **Filter หมวด:** select (filterCategory)
- ยังไม่ผูก state/API

### 3. Bulk Actions Bar (แสดงเมื่อมีรายการที่เลือก)
- แสดงเมื่อ `someSelected && (can("inventory:update") || can("inventory:export"))`
- ข้อความ "X selected"
- ปุ่ม **สั่งซื้อใหม่ (bulkReorder)** — แสดงเมื่อ `can("inventory:update")`, ปัจจุบัน disabled
- ปุ่ม **ส่งออก (bulkExport)** — แสดงเมื่อ `can("inventory:export")`, ปัจจุบัน disabled

### 4. ตารางสินค้า
- **คอลัมน์:** Checkbox (select all / per row), ชื่อ, SKU, จำนวน, สถานะ, Actions
- **Checkbox:** เลือกทั้งหมด / เลือกทีละแถว
- **สถานะ:** StatusTag (in_stock, low_stock, out_of_stock)
- **Actions ต่อแถว:**
  - แก้ไข — แสดงเมื่อ `can("inventory:update")`, ปัจจุบันไม่มี modal
  - ลบ — แสดงเมื่อ `can("inventory:delete")`, เปิด ConfirmModal
- Empty state: ข้อความจาก i18n `inventory.empty`

### 5. Modal — เพิ่มสินค้า (FormModal)
- **ฟิลด์:** ชื่อ (text), SKU (text), จำนวน (NumberInput — stepper + พิมพ์ได้), สถานะ (select: in_stock, low_stock, out_of_stock)
- Validation: ชื่อ/SKU/จำนวน required; จำนวนต้องเป็นตัวเลข ≥ 0
- ปุ่ม: ยกเลิก, บันทึก (submit loading)
- ปัจจุบัน: mock submit (setTimeout + toast success)

### 6. Modal — ยืนยันลบ (ConfirmModal)
- ข้อความยืนยัน, ปุ่มลบ (danger), loading state
- ปัจจุบัน: mock delete + toast success

---

## State (Client)

- `selected` (Set<number>), `addItemOpen`, `deleteConfirmOpen`, `deleteTargetId`, `submitLoading`, `formErrors`, `form`
- `items` = [] (รอ API)

---

## ไฟล์ที่เกี่ยวข้อง

- `app/[locale]/inventory/page.tsx` — หน้า (client, render InventoryContent)
- `components/inventory/InventoryContent.tsx` — เนื้อหาทั้งหมด (client)
- `components/ui/NumberInput.tsx` — ช่องจำนวน (stepper + พิมพ์)
- `components/ui/Modal.tsx` — FormModal, ConfirmModal
- `components/ui/StatusTag.tsx` — แสดงสถานะ
