# Production checklist — account-stock (FE + BE)

ก่อน go live ตรวจรายการด้านล่างและตั้งค่าให้ครบ

---

## Backend (account-stock-be)

| รายการ | สถานะ | หมายเหตุ |
|--------|--------|----------|
| **JWT_SECRET** | บังคับ | ตั้งค่าที่สร้างใหม่ (ไม่ใช้ default). ถ้า `APP_ENV=production` และไม่ตั้ง หรือใช้ค่า dev → server จะไม่รัน |
| **APP_ENV=production** | แนะนำ | ตั้งเมื่อ deploy production เพื่อบังคับ JWT_SECRET |
| **CORS_ORIGIN** | บังคับ (ถ้า FE คนละ origin) | ใส่ origin ของ frontend จริง (เช่น `https://your-app.vercel.app`). ห้ามใช้ localhost ใน production |
| **DATABASE_URL / SUPABASE_DB_URL** | บังคับ (ถ้าใช้ DB) | Connection string ของ production DB |
| **Migration** | บังคับ (ถ้าใช้ DB) | รัน `go run ./cmd/migrate` กับ DB ของ production ก่อนหรือหลัง deploy |
| Graceful shutdown | optional | ยังไม่มี — ใช้ reverse proxy ปิด connection |
| Rate limit | optional | ตามความเสี่ยง |

---

## Frontend (account-stock-fe)

| รายการ | สถานะ | หมายเหตุ |
|--------|--------|----------|
| **NEXT_PUBLIC_API_URL** | บังคับ | ใส่ URL ของ backend production (เช่น `https://your-be.up.railway.app`) |
| **Dev login** | ปิดอัตโนมัติ | เมื่อ build ด้วย `NODE_ENV=production` การ login ด้วย env credentials จะ return false — ไม่ต้องลบ NEXT_PUBLIC_TEST_* แต่ไม่ทำงานใน production |
| **Real auth** | ยังไม่มี | ตอนนี้ไม่มี backend login ที่ออก JWT — ต้องมี flow login จริง (หรือ Supabase Auth) ก่อนให้ user เข้าสู่ระบบใน production |
| Build | ตรวจ | `npm run build` ผ่าน และไม่มี error |

---

## สิ่งที่ยังไม่พร้อม (ต้องทำก่อนหรือหลัง go live)

1. **Login จริง** — Backend ยังไม่มี endpoint login ที่รับ username/password แล้วออก JWT. Frontend มีแค่ dev login (ปิดใน production). ต้องมี flow login จริงหรือต่อ Supabase Auth.
2. **Import API ไม่มี auth** — `POST /api/import/order-transaction` ยังไม่ตรวจ JWT; ใครก็เรียกได้. ถ้า go live ควรใส่ middleware Auth.
3. **Users list จาก DB** — `/api/users` คืน `[]` จนกว่า handler จะดึงจาก DB ด้วย TenantScope.
4. **Audit log** — ยังไม่มี.

---

## สรุป: พร้อม go live หรือยัง

- **Deploy ได้** — ถ้าตั้ง env ครบ (JWT_SECRET, CORS_ORIGIN, DB ถ้าใช้) และยอมรับว่า: ยังไม่มี login จริง (ต้องมีก่อนให้ user เข้าได้), import เป็น stub และไม่มี auth.
- **Production-ready เต็มรูปแบบ** — ต้องมี: login ที่ออก JWT (หรือ Supabase Auth), import + routes อื่นที่ต้องการให้มี auth, users จาก DB, และ CORS_ORIGIN = URL frontend จริงเท่านั้น.
