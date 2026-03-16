# account-stock — AI Agent System Prompt

## เริ่มต้นทุกครั้ง

เมื่อเริ่ม session ใหม่ ให้ทำตามลำดับนี้:

1. อ่าน `docs/MANIFEST.json` — ดู file index และสถานะโปรเจค
2. อ่าน auto-memory ที่ `.claude/projects/.../memory/MEMORY.md` — ดู context ล่าสุด
3. อ่าน `.claude/projects/.../memory/todos-*.md` — ดู TODOs ที่ค้าง
4. `git status` + `git log --oneline -5` — ดูสถานะ code
5. สรุปสั้นๆ แล้วถามว่าต้องการทำอะไรต่อ

---

## ใครใช้แอพนี้

- **Thai Users** — แม่ค้าออนไลน์ที่ใช้ระบบ inventory/accounting
- **Backend Developers** — พัฒนา Go API ที่เชื่อมต่อด้วย
- **DevOps** — Deploy และดูแล server

---

## กฎสำคัญ 7 ข้อ (ห้ามฝ่าฝืน)

### 1. Read MANIFEST First
```
ทุกครั้งที่เริ่ม session ใหม่:
- อ่าน docs/MANIFEST.json ก่อนเสมอ
- ดู file index, quick commands, recent changes
```

### 2. No Hallucination - Ground Truth Only
```
❌ อย่าทำ:
- อย่าเดาว่า API endpoint มีอะไรบ้าง → อ่าน docs/MANIFEST.json
- อย่าเดาว่า UI เป็นยังไง → อ่าน docs/DESIGN_UX_UI.md
- อย่าเดาว่า RBAC เป็นยังไง → อ่าน docs/RBAC_SPEC.md

✅ ทำแทน: อ่านไฟล์จริงก่อน พร้อมระบุ [Source: path/to/file.tsx:line]
```

### 3. Cite Sources
```
Format: [Source: path/to/file.tsx:line]

Example:
- "Calculator page uses SlidersPanel component"
  [Source: app/[locale]/calculator/page.tsx:15]

- "Inventory requires inventory:read permission"
  [Source: lib/rbac/NAV_PERMISSIONS.ts:10]
```

### 4. Label Uncertainty
```
ถ้าไม่แน่ใจ → ระบุเป็น **ASSUMPTION** + TODO

Example:
## API Endpoint for User Update

**ASSUMPTION:** Missing PUT /api/users/{id} endpoint
**TODO:** Check backend-account-stock for existing endpoints
**Source:** User requested, not verified in current code
```

### 5. ไม่ใช้ Mock Data
```
- ห้ามเพิ่ม mock data เพื่อแสดงผล
- list แสดง empty state จนกว่าจะต่อ API จริง
- ข้อมูลตัวอย่างมีไว้ที่ docs/ หรือ example-data/
```

### 6. Commit บน Feature Branch เท่านั้น
```
- ห้าม commit ลง main โดยตรง
- Branch ปัจจุบัน: (ดูจาก git status)
- Commit message: ภาษาอังกฤษ, prefix feat:/fix:/refactor:
- ลงท้าย: Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

### 7. Update Memory หลังทำงานสำคัญ
```
- .claude/projects/.../memory/MEMORY.md — สรุปสั้นๆ
- .claude/projects/.../memory/todos-*.md — TODOs
- ไม่เขียนซ้ำ ไม่เขียน session-specific data
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | Tailwind CSS 4 + custom components |
| Icons | lucide-react |
| i18n | next-intl |
| Data/State | TanStack React Query |
| Validation | Zod |
| File Parse | papaparse, xlsx |
| Deploy | Vercel (recommended) |

---

## โครงสร้างไฟล์สำคัญ

```
account-stock/
├── app/
│   ├── [locale]/                    # i18n routing
│   │   ├── layout.tsx               # MainLayout
│   │   ├── page.tsx                 # Dashboard
│   │   ├── inventory/page.tsx       # Inventory CRUD
│   │   ├── orders/page.tsx          # Orders management
│   │   ├── suppliers/page.tsx       # Suppliers
│   │   ├── import/page.tsx           # Import wizard
│   │   ├── shops/page.tsx           # Shops
│   │   ├── campaigns/page.tsx       # Campaigns
│   │   ├── vouchers/page.tsx       # Vouchers
│   │   ├── fees/page.tsx           # Fees
│   │   ├── calculator/page.tsx     # Profit calculator
│   │   ├── tax/page.tsx            # Tax calculator
│   │   ├── funnels/page.tsx        # Funnels
│   │   ├── reports/page.tsx        # Reports
│   │   ├── agents/page.tsx         # Agents
│   │   └── settings/page.tsx       # Settings
│   └── layout.tsx
├── components/
│   ├── layout/                      # Header, Sidebar, LayoutWithSidebar
│   ├── ui/                         # Button, Modal, Slider, etc.
│   ├── inventory/                  # InventoryContent
│   ├── orders/                     # OrdersContent
│   ├── calculator/                 # SlidersPanel, ResultsPanel
│   └── upload/                     # ImportWizard, FileDropzone
├── lib/
│   ├── utils.ts                    # cn, formatCurrency
│   ├── calc-engine.ts              # Calculator logic
│   └── rbac/                       # NAV_PERMISSIONS, role-permissions
├── contexts/
│   ├── AuthContext.tsx             # Auth + permissions
│   ├── ToastContext.tsx            # Toast notifications
│   └── QueryProvider.tsx           # React Query
├── messages/
│   ├── th.json                     # Thai translations
│   └── en.json                     # English translations
├── docs/
│   ├── MANIFEST.json               # File index (START HERE)
│   ├── DEV_SPEC.md                 # Tech stack + โครงสร้าง
│   ├── DESIGN_UX_UI.md             # Design guidelines
│   ├── RBAC_SPEC.md                # RBAC specifications
│   └── RBAC_BACKEND_SPEC.md        # Backend RBAC
├── .env.example                    # Environment variables template
├── package.json                    # Dependencies
├── next.config.ts                  # Next.js config
└── tailwind.config.ts              # Tailwind config
```

---

## Pages & Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | Dashboard | KPI summary, charts placeholder |
| `/inventory` | Inventory | Product list + CRUD |
| `/orders` | Orders | Order management |
| `/suppliers` | Suppliers | Supplier list |
| `/import` | Import | Wizard: type → upload → mapping → result |
| `/shops` | Shops | Shop management |
| `/campaigns` | Campaigns | Campaign management |
| `/vouchers` | Vouchers | Voucher management |
| `/fees` | Fees | Fee configuration |
| `/calculator` | Calculator | Profit calculator with sliders |
| `/tax` | Tax | Personal tax calculator |
| `/funnels` | Funnels | Sales funnels |
| `/reports` | Reports | Reports dashboard |
| `/agents` | Agents | Agent tools |
| `/settings` | Settings | User settings |

---

## RBAC (Role-Based Access Control)

### Permissions
```
dashboard:read
inventory:read, inventory:create, inventory:update, inventory:delete
orders:read, orders:create, orders:update, orders:delete
suppliers:read, suppliers:create, suppliers:update, suppliers:delete
shops:read, shops:create, shops:update, shops:delete
promotions:read, promotions:create, promotions:update, promotions:delete
analysis:read
agents:read, agents:create, agents:update, agents:delete
settings:read, settings:update
```

### Usage
```tsx
// In AuthContext
const { can } = usePermissions();
can('inventory:read'); // returns boolean

// In Sidebar - hide menu items
{can('inventory:read') && <SidebarItem href="/inventory" />}
```

---

## i18n

- **next-intl** สำหรับหลายภาษา
- ไฟล์แปล: `messages/th.json`, `messages/en.json`
- ใช้ namespace: `nav.*`, `inventory.*`, `orders.*`, `calculator.*`, `common.*`

```tsx
// ใช้ใน component
import { useTranslations } from 'next-intl';

const t = useTranslations('nav');
<t('inventory')>  // "คลังสินค้า" หรือ "Inventory"
```

---

## Quick Commands

```bash
# Run dev server
npm run dev

# Build
npm run build

# Lint
npm run lint

# Check TypeScript
npx tsc --noEmit
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL |
| `NEXT_PUBLIC_APP_URL` | No | App URL for redirects |

---

## When to Update Docs

| When | Update |
|------|--------|
| Add/change route | `docs/DEV_SPEC.md` + `docs/MANIFEST.json` |
| Add UI component | `docs/DESIGN_UX_UI.md` |
| Change RBAC | `docs/RBAC_SPEC.md` |
| Add feature | `docs/MANIFEST.json` |

---

## External Resources

- **Next.js Docs:** https://nextjs.org/docs/
- **Tailwind CSS:** https://tailwindcss.com/docs/
- **TanStack Query:** https://tanstack.com/query/latest/
- **next-intl:** https://next-intl-docs.vercel.app/
