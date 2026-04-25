# Project-specific context (สำหรับ AI)

อ่านไฟล์นี้ก่อนทำ task — เป็นกฎและบริบทของโปรเจค

---

## กฎการ import (บังคับใช้)

**โค้ดใน feature ห้าม import ข้าม feature** — ใช้ได้แค่ของร่วม:

| อนุญาต | หมายเหตุ |
|--------|----------|
| `@/components/ui/*` | ปุ่ม, Modal, StatusTag, NumberInput, Slider, Loading, Skeleton ฯลฯ |
| `@/lib/utils` | `cn`, `formatCurrency` ฯลฯ |
| `@/contexts/*` | AuthContext, ToastContext ฯลฯ |
| `@/lib/<feature>/*` | เฉพาะ feature นั้น (เช่น calculator → `@/lib/calculator/engine`) |
| relative ภายใน feature เดียวกัน | `./FileDropzone`, `./file-parser` ฯลฯ |

**ห้าม** จากภายใน `components/inventory`, `components/calculator`, `components/upload`:

- ห้าม import จาก feature อื่น (`@/components/inventory`, …)
- ห้าม import จาก `@/components/layout`, `@/components/providers`, `@/components/AppSwitcher` (ให้เฉพาะ app/layout ใช้)

บังคับใช้ผ่าน ESLint `no-restricted-imports` ใน `eslint.config.mjs`.

---

## โครงสร้าง feature

- Feature ละโฟลเดอร์: `components/inventory`, `components/calculator`, `components/upload`
- Route ต่อหน้า: `app/[locale]/<feature>/page.tsx`
- Logic แยกใน lib: เช่น `lib/calculator/engine.ts` — ไม่พึ่ง feature อื่น

รายละเอียดความพร้อมแยกโมดูล/ฟีเจอร์ → `docs/DEV_SPEC.md` (ส่วน "ความพร้อมแยกฟีเจอร์/โมดูล")

---

## Design System

### โทนสี (Color Palette)

| Scope | Palette | ตัวอย่าง |
|-------|---------|---------|
| Seller dashboard (ทั่วไป) | Blue/Neutral (Jira-style) | `--primary: 217 91% 40%` |
| **Affiliate dashboard** | **Warm Brown (congrate-style)** | `text-brown-*`, `border-brown-*`, `bg-brown-*` |

Brown tokens พร้อมใช้ใน Tailwind: `brown-50` → `brown-950`  
นิยามไว้ใน `app/globals.css` ภายใต้ `@theme { --color-brown-* }`

### Affiliate Dashboard UI Pattern

ตรงกับ congrate-seller ดังนี้:

1. **Hero card** — `bg-linear-to-br from-brown-700 to-brown-800` พร้อม sub-cards (settled, pending)
2. **Status bar** — Progress bar แบบ 3 สี (emerald=settled, amber=pending, red=ineligible)
3. **Insight alerts** — Red card (ineligible) + Amber card (pending) ด้านล่าง status bar
4. **DashboardSection** — ใช้ component ที่ `components/dashboard/DashboardSection.tsx` ทุก section
5. **Charts** — lazy dynamic import (`ssr: false`) จาก `components/affiliate/AffiliateCharts.tsx`
   - `AffiliateTopShopsChart` — horizontal bar (earned + ineligibleAmount stacked)
   - `AffiliateProductsChart` — horizontal bar (commission)
6. **Verdict card** — `bg-brown-50 border-brown-200` พร้อม badge (emerald/amber) + insight text
7. **Table** — 4 คอลัมน์ sticky left-0 สำหรับชื่อ, `font-mono` สำหรับตัวเลข
8. **Show more/less** — ปุ่ม `bg-brown-50/50 hover:bg-brown-100 border-brown-100` ถ้า > 5 items
9. **ActionableTip** — `bg-brown-50 border-brown-200 text-brown-800` พร้อม Lightbulb icon

### sessionStorage Key

- `"affiliate-dashboard-summary"` — เก็บ `AffiliateSummary` JSON หลัง import affiliate
- อ่านใน `AffiliateDashboard` ผ่าน `useEffect`
- ลบออกเมื่อกด "Seller Dashboard" → `router.refresh()`

### Affiliate Import Flow

1. Upload file → `ImportWizard` parse → save `AffiliateSummary` to sessionStorage
2. Background POST `/api/affiliate/import` (non-blocking)
3. `router.push("/")` → `DashboardContent` ตรวจ `sessionStorage` → render `AffiliateDashboard`
4. ถ้า `user.role === "Affiliate"` → แสดง `AffiliateDashboard` เสมอ (ไม่ต้องมี sessionStorage)
