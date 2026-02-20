# Feature Spec — Import (นำเข้าข้อมูล)

สรุปฟีเจอร์จากโค้ด

---

## Route & Permission

- **Route:** `/[locale]/import`
- **Permission:** (ตาม NAV_PERMISSIONS ในโปรเจกต์ — เช่น import:create หรือเทียบเท่า)

---

## ฟีเจอร์หลัก (จากโค้ด)

### 1. Page Header
- หัวข้อ: title (i18n: `import.title`)

### 2. Import Wizard (ImportWizard)
- **ขั้นตอน (steps):** select-type → upload → mapping → result

#### Step 1 — เลือกประเภทข้อมูล (select-type)
- ตัวเลือก: **สินค้าคงคลัง** (inventory), **คำสั่งซื้อ** (orders)
- แต่ละตัว: label, icon, description
- เลือกแล้วไป step upload

#### Step 2 — อัปโหลดไฟล์ (upload)
- ใช้ FileDropzone — รับไฟล์ (CSV/Excel ตามที่ parser รองรับ)
- อัปโหลดแล้ว parse (parseFile), auto-detect mappings (autoDetectMappings), ไป step mapping
- แสดง error / parseWarnings

#### Step 3 — Mapping (mapping)
- ใช้ ColumnMapper — map คอลัมน์จากไฟล์ → ฟิลด์ของ data type (inventory/orders)
- DataPreview — แสดงตัวอย่างข้อมูลที่ map แล้ว
- ปุ่มนำเข้า → เรียก validateRows, ส่ง API (หรือ mock) → ไป step result

#### Step 4 — Result (result)
- แสดง ImportResult: imported, skipped, duplicates, errors[]
- ปุ่มปิด / นำเข้าต่อ (onClose, onImportComplete)

### 3. Data Type & Parser
- **Data types:** inventory, orders
- **Parser:** parseFile, autoDetectMappings, validateRows (จาก file-parser)
- รองรับ headers, rows, warnings

### 4. Props (Optional)
- onClose, onImportComplete(result), defaultDataType — สำหรับใช้ใน modal หรือหน้าเต็ม

---

## ไฟล์ที่เกี่ยวข้อง

- `app/[locale]/import/page.tsx` — หน้า (client, render ImportWizard)
- `components/upload/ImportWizard.tsx` — วิซาร์ดหลายขั้น
- `components/upload/FileDropzone.tsx` — ลาก/เลือกไฟล์
- `components/upload/ColumnMapper.tsx` — map คอลัมน์
- `components/upload/DataPreview.tsx` — แสดงตัวอย่าง
- `components/upload/file-parser.ts` (หรือ path ที่ใช้) — parse, autoDetect, validate
