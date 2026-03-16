# TODO: สถาปัตยกรรมและ Observability

รายการที่ควรทำเมื่อพร้อม — อ้างอิงจากโครงโปรเจคและ feature ปัจจุบัน

---

## 1. Modular Domain Boundary

- แยก domain ชัด (feature ละก้อน, ไม่ import ข้าม) — ดู `project-specific_context.md` และ `docs/DEV_SPEC.md` (ส่วน "ความพร้อมแยกฟีเจอร์/โมดูล")
- ถ้าต่อ API ภายหลัง: กำหนด boundary ระหว่าง frontend กับ backend (เช่น BFF หรือ direct API) และ contract (types / API spec)

---

## 2. Policy-based logic (แทน hardcode)

- หลีกเลี่ยงการ hardcode สิทธิ์/กฎใน component — ใช้ policy หรือ config (เช่น `lib/rbac`, NAV_PERMISSIONS)
- Permission / feature flag อ่านจาก config หรือ API เพื่อให้เปลี่ยนได้โดยไม่ต้องแก้โค้ด

---

## 3. Prompt injection / input safety

- ถ้ามีการส่ง input ไปยัง LLM หรือระบบที่ interpret text: ตรวจสอบและ sanitize input เพื่อลดความเสี่ยง prompt injection
- กำหนดแนวทางสำหรับ user-generated content ที่ไปยัง AI/backend

---

## 4. Structured logging, tracing, metrics

- **Logging:** structured log (JSON หรือ key-value) มี correlation id / request id เพื่อไล่ flow ข้าม service
- **Tracing:** ถ้ามีหลาย service — distributed tracing (เช่น OpenTelemetry) เพื่อดู latency ต่อ request
- **Metrics:** counter, gauge สำหรับ business และ technical (request count, error rate, latency p50/p95)
- **Error budget:** กำหนด SLO และ error budget ต่อ feature หรือ service (ถ้ามี SLA)

---

## 5. Cost monitoring (รวม LLM token)

- ติดตาม cost ของ infra (hosting, API ภายนอก) และ cost จากการใช้ LLM (token usage ต่อ request/feature)
- Use case: “Feature นี้เดือนนี้ cost infra เท่าไหร่?” — ออกแบบให้แยก cost ต่อ feature หรือ tag ได้

---

## 6. สรุปลำดับที่แนะนำ

| ลำดับ | หัวข้อ | หมายเหตุ |
|-------|--------|----------|
| 1 | Modular boundary + no cross-feature import | ทำแล้วในระดับโค้ด (ESLint); เติม contract เมื่อมี API |
| 2 | Policy-based permission | มี lib/rbac อยู่แล้ว — ขยายแทน hardcode ใน UI |
| 3 | Structured logging | เพิ่มเมื่อมี backend หรือ BFF |
| 4 | Metrics + cost (รวม LLM) | เมื่อต้องการรายงานและควบคุม cost |
| 5 | Tracing / error budget | เมื่อมีหลาย service หรือ SLO ชัด |

---

*อัปเดต doc นี้เมื่อมี backend, BFF หรือบริการภายนอกเพิ่ม.*
