# Dev Spec — account-stock-fe (Next.js)

อัปเดตจากโครงและโค้ดปัจจุบัน — เมนู + หน้า UI ทั้งชุด, ยังไม่ต่อ API.

**นโยบายข้อมูล:** ไม่ใช้ mock data เป็นค่าเริ่มต้น — list แสดง empty state จนกว่าต่อ API. ถ้า feature ใดระบุ "mock" หรือ "demo data" ให้ถือว่าเป็น dev-only ชั่วคราวและจะเอาออกเมื่อต่อ API.

---

## Tech Stack

| สิ่งที่ใช้ | ตัวเลือก |
|-----------|----------|
| Framework | **Next.js 16** (App Router) |
| หลายภาษา | **next-intl** |
| UI | **Tailwind CSS 4** + components ใน `components/ui/` (ปุ่ม, Modal, Slider, StatusTag, NumberInput, Loading, Skeleton ฯลฯ) |
| Icons | **lucide-react** |
| Data / State | **TanStack React Query** (พร้อมใช้); ยังไม่ต่อ API — list แสดง empty state |
| อื่นๆ | papaparse, xlsx, zod, react-dropzone (ใช้ใน Import) |

---

## โครงโฟลเดอร์ (ปัจจุบัน)

```
account-stock-fe/
├── app/
│   ├── [locale]/           # i18n
│   │   ├── layout.tsx      # MainLayout
│   │   ├── page.tsx        # Dashboard /
│   │   ├── inventory/page.tsx
│   │   ├── orders/page.tsx
│   │   ├── suppliers/page.tsx
│   │   ├── import/page.tsx
│   │   ├── shops/page.tsx
│   │   ├── campaigns/page.tsx
│   │   ├── vouchers/page.tsx
│   │   ├── fees/page.tsx
│   │   ├── calculator/page.tsx
│   │   ├── tax/page.tsx
│   │   ├── funnels/page.tsx
│   │   ├── reports/page.tsx
│   │   ├── agents/page.tsx
│   │   └── settings/page.tsx
│   └── layout.tsx
├── components/
│   ├── layout/             # Header, Sidebar, LayoutWithSidebar, CommandPalette, LanguageSwitcher
│   ├── ui/                  # Button, Modal, Slider, StatusTag, NumberInput, Loading, Skeleton ฯลฯ
│   ├── inventory/           # InventoryContent
│   ├── orders/              # OrdersContent
│   ├── calculator/          # SlidersPanel, ResultsPanel, AnalysisSection
│   ├── upload/              # ImportWizard, FileDropzone, ColumnMapper, DataPreview, file-parser
│   └── providers/           # IntlProviderWrapper
├── lib/
│   ├── utils.ts             # cn, formatCurrency ฯลฯ
│   ├── calculator/engine.ts
│   ├── upload/file-validator.ts
│   ├── validators/          # inventory, order, supplier, report, sanitize
│   ├── rbac/                # constants (NAV_PERMISSIONS), role-permissions, types
│   └── hooks/use-api.ts
├── contexts/                # AuthContext, ToastContext
├── messages/                # th.json, en.json
├── docs/
│   ├── DEV_SPEC.md
│   ├── DESIGN_UX_UI.md
│   └── feature/*.md
├── project-specific_context.md
└── AGENTS.md
```

---

## เมนูและ Route

| กลุ่ม | เมนู | Path | หน้าที่ |
|-------|------|------|--------|
| — | Dashboard | `/` | สรุป KPI (— รอ API), chart placeholder, low stock/recent orders empty, quick actions |
| — | Inventory | `/inventory` | รายการสินค้า + ค้นหา/filter + Add/Edit/Delete — empty state |
| — | Orders | `/orders` | รายการ order + Place Order — empty state |
| — | Suppliers | `/suppliers` | โครงตาราง, empty state |
| — | Import | `/import` | Wizard: ประเภท → อัปโหลด → mapping → result |
| — | Shops | `/shops` | หน้า placeholder |
| โปรโมชั่น | Campaigns | `/campaigns` | หน้า placeholder |
| โปรโมชั่น | Vouchers | `/vouchers` | หน้า placeholder |
| โปรโมชั่น | Fees | `/fees` | หน้า placeholder |
| วิเคราะห์ | Calculator | `/calculator` | Sliders ราคา/ต้นทุน/การตลาด, ผลลัพธ์, Breakeven, Sensitivity, Scenarios, Monte Carlo |
| วิเคราะห์ | Tax | `/tax` | ภาษีบุคคลธรรมดา: bracket, ตัวเลขเสีย/ได้คืน, export copy |
| วิเคราะห์ | Funnels | `/funnels` | หน้า placeholder |
| วิเคราะห์ | Reports | `/reports` | โครงการ์ด, placeholder |
| เครื่องมือ | Agents | `/agents` | หน้า placeholder |
| เครื่องมือ | Settings | `/settings` | หน้า placeholder |

---

## หน้าหลัก (สรุป)

- **Dashboard:** KPI cards (—), chart 7 วัน placeholder, สต็อกใกล้หมด/คำสั่งซื้อล่าสุด "ไม่มีข้อมูล — รอต่อ API", quick actions (Inventory, Orders, Import, Calculator).
- **Inventory:** Toolbar (Search, Filter สถานะ/หมวด), ตาราง empty state, Add/Edit/Delete + confirmation, bulk actions (disable เมื่อไม่มีข้อมูล).
- **Orders:** Toolbar (Search, Filter วันที่/สถานะ), ตาราง empty state, Place Order + confirmation.
- **Suppliers / Shops / Campaigns / Vouchers / Fees / Funnels / Reports / Agents / Settings:** หน้าโครงหรือ placeholder พร้อมต่อ API ทีหลัง.
- **Import:** Wizard เลือกประเภท → อัปโหลด → mapping คอลัมน์ → result.
- **Calculator:** โหมด Simple/Advanced, Sliders (Pricing, Costs, Marketing, Returns), KPIs, Breakeven, Scenarios, Sensitivity, Monte Carlo (collapsible).
- **Tax:** ภาษีบุคคลธรรมดา — bracket, slider รายได้, ตัวเลขเสีย/ได้คืน, tips, export copy.

---

## RBAC

- **lib/rbac:** `NAV_PERMISSIONS` map path → permission (เช่น `/inventory` → `inventory:read`). Resources: dashboard, inventory, orders, suppliers, shops, promotions, analysis, agents, settings.
- **AuthContext:** `usePermissions()`, `can(permission)` — ใช้ใน Sidebar เพื่อซ่อนเมนูที่ไม่มีสิทธิ์.
- ยังไม่ต่อ API — role/session เป็น mock เมื่อ backend ไม่มี; เมื่อต่อ API แล้วให้ backend เป็น source of truth.

---

## i18n

- **next-intl:** `messages/th.json`, `messages/en.json`. Key แยก namespace: `nav.*`, `inventory.*`, `orders.*`, `calculator.*`, `tax.*`, `common.*`, `status.*` ฯลฯ
- Header: สลับภาษา (TH/EN). Sidebar: แสดงตามสิทธิ์.

---

## กฎโปรเจค (สำหรับ AI)

- **Import:** ห้าม feature import ข้าม feature — ใช้ได้แค่ `@/components/ui`, `@/lib/utils`, `@/contexts`, `@/lib/<feature>`. รายละเอียดบังคับใช้ → `project-specific_context.md`; บังคับผ่าน ESLint `no-restricted-imports` ใน `eslint.config.mjs`.
- **ไม่ใช้ mock data:** list แสดง empty state จนกว่าจะต่อ API.

---

## ความพร้อมแยกฟีเจอร์/โมดูล

โครงสร้างเหมาะกับการแยกเป็น **โมดูลใน repo เดียว** (monorepo/packages) มากกว่าแยกไปอีกโปรเจกต์โดยไม่พกของร่วม — ทุก feature พึ่ง layout, contexts, ui, lib/utils; แยกไปที่อื่นต้องพก shared หรือทำ adapter.

### สรุปโดยรวม

| ด้าน | สถานะ |
|------|--------|
| แยกตาม feature (โฟลเดอร์ชัด) | ✅ inventory, orders, calculator, upload |
| Route ต่อหน้า | ✅ `app/[locale]/<feature>/page.tsx` |
| Dependency ของร่วม | ⚠️ หนัก — แยกไปที่อื่นต้องพก ui, contexts, utils |
| RBAC / i18n | ✅ ใช้ร่วมกัน; แยก feature ต้อง slice permission/messages |
| Logic ใน lib | ✅ Calculator, Tax, Import มี lib แยก |

### แยกไปอีกโปรเจกต์ vs แยกเป็นโมดูลใน repo

| Feature | แยกไปอีกโปรเจกต์ | แยกเป็นโมดูลใน repo |
|---------|-------------------|----------------------|
| **Calculator** | ✅ เหมาะสุด (engine + Slider + utils + messages) | ✅ ง่าย |
| **Import** | ✅ ได้ (upload/* + utils) | ✅ ง่าย |
| **Tax** | ✅ ได้ (logic ในหน้า/ย้าย lib/tax + Slider + utils) | ✅ ง่าย |
| **Inventory / Orders** | ⚠️ ได้แต่ต้องพก auth, toast, ui หลายตัว | ✅ ทำได้ |
| **Dashboard** | ❌ ไม่แนะนำ (จุดรวมหลายฟีเจอร์) | ⚠️ ทำได้ถ้ามี API สรุป |
| **Suppliers, Shops, Campaigns, Vouchers, Fees, Funnels, Reports, Agents, Settings** | ❌ ยังเป็นแค่โครง | ⚠️ เก็บใน app หลักก่อน |

### แนวทางเมื่อจะแยกโมดูลจริง

1. เก็บ feature ละก้อนในโฟลเดอร์ตัวเอง (หรือ `packages/<feature>` ถ้า monorepo).
2. ใช้เฉพาะ `@/components/ui`, `@/lib/utils`, `@/contexts` จาก shared — ไม่ import ข้าม feature.
3. กำหนด contract ของ shared (เช่น AuthContext มี `usePermissions()`, Toast มี `showSuccess`/`showError`) เพื่อทำ stub/adapter ที่ปลายทาง.
4. i18n แยกไฟล์ต่อ feature ได้ (เช่น `messages/inventory.json`) แล้วรวมใน config — เวลาเอา feature ไปที่อื่น copy เฉพาะที่เกี่ยวข้อง.

---

*อัปเดตเมื่อมี route/เมนู, tech หรือโครง feature เปลี่ยน.*
