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
