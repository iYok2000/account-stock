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
| **ROOT_EMAIL, ROOT_PASSWORD, ROOT_CONFIRM_CODE** | บังคับ (ถ้าใช้ Root login) | ค่า server-side เท่านั้น — ห้ามใส่ใน FE ใน production |
| **Migration** | บังคับ (ถ้าใช้ DB) | รัน migration (รวม 000003_shops_and_user_shop) กับ DB ของ production ก่อนหรือหลัง deploy |
| Graceful shutdown | optional | ยังไม่มี — ใช้ reverse proxy ปิด connection |
| Rate limit | optional | ตามความเสี่ยง |

---

## Frontend (account-stock-fe)

| รายการ | สถานะ | หมายเหตุ |
|--------|--------|----------|
| **NEXT_PUBLIC_API_URL** | บังคับ | ใส่ URL ของ backend production (เช่น `https://your-be.up.railway.app`) |
| **Dev login** | เอาออกแล้ว | FE ไม่มีเส้นทางเทียบ env credentials; ใช้ `/api/auth/login` เสมอ (รวม dev) |
| **Real auth** | มีแล้ว | Backend มี `POST /api/auth/login` ออก JWT. FE เรียก login API แล้วเก็บ token ผ่าน setAuthToken; ไม่ส่ง root/test credentials ใน client |
| **FE mock session** | ปิดใน production | ถ้า `/api/auth/me` fail ใน production ไม่ fallback mock; ต้องให้ backend ตอบ 200 พร้อม roles, permissions, shop_id, shop_name |
| **Lint** | pre-release | ก่อน release รัน `npm run lint` และแก้ error ให้หมด — ต้องผ่านก่อน merge/deploy |
| Build | ตรวจ | `npm run build` ผ่าน และไม่มี error |

---

## สิ่งที่ยังไม่พร้อม (ต้องทำก่อนหรือหลัง go live)

1. **Login ผ่าน API ใน FE** — Backend มี `POST /api/auth/login` แล้ว. Frontend ควรใช้ login API สำหรับทุก role (รวม Root ส่ง confirm_code) และเก็บ JWT ผ่าน setAuthToken; ปิดการเทียบ root credentials ฝั่ง client ใน production (หรือย้าย Root login ไปเรียก API เท่านั้น).
2. **Import API** — `POST /api/import/order-transaction` ต้องส่ง Bearer JWT; backend ใส่ middleware Auth + RequirePermission แล้ว.
3. **Users list จาก DB** — `/api/users` ยังคืน `[]` (legacy). สมาชิกร้านใช้ GET `/api/shops/me` (SuperAdmin).
4. **Audit log** — ยังไม่มี.

---

## สรุป: พร้อม go live หรือยัง

- **Deploy ได้** — ถ้าตั้ง env ครบ (JWT_SECRET, CORS_ORIGIN, DATABASE_URL, ROOT_* บน BE) และ FE ใช้ POST /api/auth/login + setAuthToken; รัน migration (รวม 000003 shops) บน DB.
- **Production-ready เต็มรูปแบบ** — ต้องมี: FE เรียก login API เก็บ JWT (ไม่ใส่ root password ใน NEXT_PUBLIC_ ใน production), ทุก route ที่ต้องป้องกันใช้ RequirePermission, CORS_ORIGIN = URL frontend จริงเท่านั้น.
