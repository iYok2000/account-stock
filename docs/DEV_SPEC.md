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
│   │   ├── import/page.tsx
│   │   ├── shops/create/page.tsx
│   │   ├── shops/me/page.tsx
│   │   ├── campaigns/page.tsx
│   │   ├── vouchers/page.tsx
│   │   ├── fees/page.tsx
│   │   ├── calculator/page.tsx
│   │   ├── tax/page.tsx
│   │   ├── reports/page.tsx
│   │   ├── agents/page.tsx
│   │   └── settings/page.tsx
│   └── layout.tsx
├── components/
│   ├── layout/             # Header, Sidebar, LayoutWithSidebar, CommandPalette, LanguageSwitcher
│   ├── ui/                  # Button, Modal, Slider, StatusTag, NumberInput, Loading, Skeleton ฯลฯ
│   ├── inventory/           # InventoryContent
│   ├── calculator/          # SlidersPanel, ResultsPanel, AnalysisSection
│   ├── upload/              # ImportWizard, FileDropzone, ColumnMapper, DataPreview, file-parser
│   └── providers/           # IntlProviderWrapper
├── lib/
│   ├── utils.ts             # cn, formatCurrency ฯลฯ
│   ├── calculator/engine.ts
│   ├── upload/file-validator.ts
│   ├── validators/          # inventory, report, sanitize
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
| — | Dashboard | `/` | สรุป KPI (— รอ API), chart placeholder, low stock empty, quick actions |
| — | Inventory | `/inventory` | รายการสินค้า + ค้นหา/filter — empty state |
| — | Import | `/import` | Wizard: ประเภท → อัปโหลด → mapping → result |
| — | Inventory import save | (POST) `/api/inventory/import` | upsert SKU/วัน จากผล process |
| — | สร้างร้านค้า | `/shops/create` | สร้างร้าน + สมาชิก (Root only) |
| — | สมาชิกร้าน | `/shops/me` | แก้ชื่อร้าน + จัดการสมาชิก (SuperAdmin) |
| — | Users | `/users` | รายชื่อผู้ใช้ (SuperAdmin) |
| เครื่องมือ | Admin Hub | `/admin` | Admin landing page (Root/SuperAdmin) — sections: Users, Shops, Invites, Settings, Platform Overview |
| เครื่องมือ | Invite Codes | `/admin/invites` | จัดการ Invite Codes + Tier (Root/SuperAdmin) — CRUD + toggle require_invite_code |
| โปรโมชั่น | Campaigns | `/campaigns` | หน้า placeholder |
| โปรโมชั่น | Vouchers | `/vouchers` | หน้า placeholder |
| โปรโมชั่น | Fees | `/fees` | หน้า placeholder |
| วิเคราะห์ | Calculator | `/calculator` | Sliders ราคา/ต้นทุน/การตลาด, ผลลัพธ์, Breakeven, Sensitivity, Scenarios, Monte Carlo |
| วิเคราะห์ | Tax | `/tax` | ภาษีบุคคลธรรมดา: bracket, ตัวเลขเสีย/ได้คืน, export copy |
| วิเคราะห์ | Reports | `/reports` | โครงการ์ด, placeholder |
| เครื่องมือ | Agents | `/agents` | หน้า placeholder |
| เครื่องมือ | Users | `/users` | รายชื่อผู้ใช้ (SuperAdmin) |

---

## หน้าหลัก (สรุป)

- **Dashboard:** KPI cards (—), chart 7 วัน placeholder, สต็อกใกล้หมด "ไม่มีข้อมูล — รอต่อ API", quick actions ที่กรองตามสิทธิ์ของ role (เช่น Admin, SuperAdmin เห็น Inventory, Import, Calculator; Affiliate เห็นเฉพาะ Import Affiliate).
- **Inventory:** Toolbar (Search), ตาราง empty state, แก้ไขเฉพาะชื่อ/SKU, qty แสดงอย่างเดียว.
- **Admin Hub (`/admin`):** Landing page สำหรับ Root/SuperAdmin — sections: Users management, Shops, Invite Codes, Settings, Platform Overview (Root only). ใช้ `DashboardSection` component (collapsible, localStorage persistence).
- **Invite Codes (`/admin/invites`):** CRUD interface สำหรับ invite codes — toggle global switch (`require_invite_code`), create form (auto-gen หรือ manual code), list view (code, tier, usage stats, actions: copy/toggle/deactivate). Empty state เมื่อไม่มี codes. ใช้ `useToast` (showSuccess/showError).
- **Affiliate Dashboard (`/affiliate`):** **ยุบเข้ากับ `/` แล้ว** — `DashboardContent` ปรับ content ตาม `role === "Affiliate"` (ซ่อน AOV, แสดง top earning แทน low stock, กรอง quick actions)
- **Shops / Campaigns / Vouchers / Fees / Reports / Agents:** หน้าโครงหรือ placeholder พร้อมต่อ API ทีหลัง.
- **Import:** Wizard เลือกประเภท → อัปโหลด → mapping คอลัมน์ → result → บันทึกเข้า Inventory (SKU/วัน).
- **Calculator:** โหมด Simple/Advanced, Sliders (Pricing, Costs, Marketing, Returns), KPIs, Breakeven, Scenarios, Sensitivity, Monte Carlo (collapsible).
- **Tax:** ภาษีบุคคลธรรมดา — bracket, slider รายได้, ตัวเลขเสีย/ได้คืน, tips, export copy.

---

## Components และ Patterns ใหม่

### DashboardSection (`components/dashboard/DashboardSection.tsx`)

Collapsible section container ที่ใช้ localStorage persistence. Adapted จาก Congrats-seller.

**Props:**
- `id`: string (unique, สำหรับ localStorage key)
- `title`: string
- `icon`: ReactNode
- `collapsible`: boolean (default: true)
- `defaultOpen`: boolean (default: false)
- `summary`: string (แสดงเมื่อ collapsed)
- `warningBadge`: string (badge สีแดง, optional)
- `chartCount`: number (badge count, optional)
- `children`: ReactNode

**ใช้ใน:**
- Admin Hub sections (Users, Shops, Invites, Settings)
- Affiliate Dashboard sections (Overview, Performance, Shops)

### Design Tokens (`lib/design-tokens.ts`)

Semantic color palette สำหรับความสม่ำเสมอใน UI. Copied จาก Congrats-seller.

**Exports:**
- `semanticColors`: object — revenue (emerald), commission, growth, warning (amber), danger (red), affiliate (purple), neutral (slate)
- แต่ละ key มี: bg, border, text, icon, iconBg, gradient, ring, chart properties
- `chartColors`: object — hex values สำหรับ Recharts (brandDark, revenue, profit, loss, fee, affiliate, etc.)

**ใช้ใน:**
- KPI cards (AffiliateKpiCard)
- Charts (ถ้ามี)
- Status badges

### ~~AffiliateKpiCard~~ (removed)

**ยุบเข้ากับ DashboardContent แล้ว** — Affiliate ใช้ main dashboard ที่ `/` ปรับ content ตาม role อัตโนมัติ

---

## RBAC และ Auth

- **Roles (4 แบบ):** Root, SuperAdmin, Admin, Affiliate — ดู [SHOPS_AND_ROLES_SPEC.md](SHOPS_AND_ROLES_SPEC.md), [ROLES_SUMMARY.md](ROLES_SUMMARY.md).
- **lib/rbac:** `NAV_PERMISSIONS` map path → permission (เช่น `/shops/create` → `shops:create`, `/shops/me` → `users:read`). Resources: dashboard, inventory, shops, promotions, analysis, agents, settings, users.
- **AuthContext:** `usePermissions()`, `can(permission)` — ใช้ใน Sidebar เพื่อซ่อนเมนูที่ไม่มีสิทธิ์. Session มี `shopId`, `shopName` (null สำหรับ Root).
- **Login:** Root login ด้วย env + รหัสยืนยัน (client หรือส่งไป POST /api/auth/login); user อื่นเรียก POST /api/auth/login แล้วได้ JWT — เก็บ token ด้วย `setAuthToken`, request ต่อไปส่ง Bearer.
- **Route guard:** หน้าที่ต้องเช็คสิทธิ์ใช้ `RequirePermission(permission)` (เช่น `/shops/create` → `shops:create`, `/shops/me` → `users:read`, `/users` → `users:read`). Redirect เมื่อไม่มีสิทธิ์.
- **Backend เป็น source of truth** — role/permissions จาก GET /api/auth/me หรือจาก JWT หลัง login.

---

## i18n

- **next-intl:** `messages/th.json`, `messages/en.json`. Key แยก namespace: `nav.*`, `inventory.*`, `calculator.*`, `tax.*`, `common.*`, `status.*` ฯลฯ
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
| แยกตาม feature (โฟลเดอร์ชัด) | ✅ inventory, calculator, upload |
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
| **Suppliers, Shops, Campaigns, Vouchers, Fees, Reports, Agents** | ❌ ยังเป็นแค่โครง | ⚠️ เก็บใน app หลักก่อน |

### แนวทางเมื่อจะแยกโมดูลจริง

1. เก็บ feature ละก้อนในโฟลเดอร์ตัวเอง (หรือ `packages/<feature>` ถ้า monorepo).
2. ใช้เฉพาะ `@/components/ui`, `@/lib/utils`, `@/contexts` จาก shared — ไม่ import ข้าม feature.
3. กำหนด contract ของ shared (เช่น AuthContext มี `usePermissions()`, Toast มี `showSuccess`/`showError`) เพื่อทำ stub/adapter ที่ปลายทาง.
4. i18n แยกไฟล์ต่อ feature ได้ (เช่น `messages/inventory.json`) แล้วรวมใน config — เวลาเอา feature ไปที่อื่น copy เฉพาะที่เกี่ยวข้อง.

---

*อัปเดตเมื่อมี route/เมนู, tech หรือโครง feature เปลี่ยน.*
