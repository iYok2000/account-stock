# Documentation Steward - Usage Guide

**Status:** Ready for SSOT
**Version:** 1.0.0
**Project:** account-stock (Go API)

---

## Quick Start - ใช้ Docs ยังไง?

### เริ่มต้น Session ใหม่ (แนะนำ)

```
อ่าน docs/MANIFEST.json ก่อน แล้วสรุปสถานะโปรเจคให้ฟัง
```

**Agent จะ:**
1. อ่าน MANIFEST.json (file index)
2. เช็ค git status
3. สรุปสถานะปัจจุบัน
4. ถามว่าต้องการทำอะไรต่อ

---

### ค้นหาข้อมูลเฉพาะเรื่อง

**Database Schema:**
```
อ่าน docs/DB_SPEC.md แล้วสรุป database schema
```

**Entity Definitions:**
```
อ่าน docs/ENTITY_SPEC.md แล้วสรุป entities
```

**Security:**
```
อ่าน docs/SECURITY.md แล้วบอก security guidelines
```

**Deployment:**
```
อ่าน docs/DEPLOY.md แล้วบอกวิธี deploy
```

**Supabase:**
```
อ่าน docs/SUPABASE.md แล้วบอกวิธีต่อ Supabase
```

**Feature Specs:**
```
อ่าน docs/feature/01-auth.md (Auth)
อ่าน docs/feature/02-users.md (Users)
อ่าน docs/feature/03-import.md (Import)
อ่าน docs/feature/04-shops.md (Shops)
```

---

## 📚 Documentation Structure

```
docs/
├── MANIFEST.json                  # ⭐ START HERE - File index
├── DB_SPEC.md                     # Database schema (GORM)
├── ENTITY_SPEC.md                 # Entity definitions
├── SECURITY.md                    # Security guidelines (OWASP)
├── SUPABASE.md                    # Supabase connection guide
├── DEPLOY.md                      # Deployment guide
├── PRODUCTION_READINESS.md        # Production checklist
└── feature/
    ├── 01-auth.md                 # Authentication spec
    ├── 02-users.md                # Users feature spec
    ├── 03-import.md               # Import feature spec
    └── 04-shops.md                # Shops feature spec
```

---

## 🚫 Hard Rules (ห้ามฝ่าฝืน)

### Rule 1: Always Read MANIFEST.json First

```
อ่าน docs/MANIFEST.json ก่อนเสมอเมื่อเริ่ม session ใหม่
```

**ทำไม?** MANIFEST.json มี:
- File index (รู้ว่าไฟล์อะไรอยู่ที่ไหน)
- Quick reference commands
- Recent session history

### Rule 2: No Hallucination - Ground Truth Only

❌ **อย่าทำ:**
- อย่าเดาว่า API endpoint มีอะไรบ้าง → อ่าน `README.md` หรือ `internal/handler/`
- อย่าเดาว่า database schema เป็นยังไง → อ่าน `docs/DB_SPEC.md`
- อย่าเดาว่า entity เป็นยังไง → อ่าน `docs/ENTITY_SPEC.md`
- อย่าเดาว่า RBAC เป็นยังไง → อ่าน `internal/rbac/rbac.go`

✅ **ทำแทน:**
```go
// ❌ Wrong: Assume and guess
"The user model has email and password fields"

// ✅ Correct: Read and cite
"The user model has email and password fields"
[Source: internal/model/user.go:10-15]
```

### Rule 3: Cite Sources

**Format:** `[Source: path/to/file.go:line]`

**Examples:**
```markdown
- "GET /api/users requires users:read permission"
  [Source: README.md:33]

- "company_id is required for multi-tenant scope"
  [Source: docs/ENTITY_SPEC.md:15]

- "JWT_SECRET is required in production"
  [Source: docs/SECURITY.md:20]

- "SuperAdmin can do everything"
  [Source: internal/rbac/rbac.go:20]
```

### Rule 4: Label Uncertainty

ถ้าไม่แน่ใจ → ระบุเป็น **ASSUMPTION** + TODO

```markdown
## API Endpoint for User Update

**ASSUMPTION:** Missing PUT /api/users/{id} endpoint
**TODO:** Check internal/handler/users.go for existing endpoints
**Source:** User requested, not verified in current code
**Status:** Need to verify in codebase
```

---

## 💡 Common Queries - ตัวอย่างการถาม

### สอบถามข้อมูล

```
Q: Database ใช้อะไร?
A: อ่าน docs/DB_SPEC.md
   → PostgreSQL via GORM, Supabase compatible

Q: API endpoints มีอะไรบ้าง?
A: อ่าน README.md section "Endpoints"
   → /health, /api/auth/me, /api/users, /api/shops, /api/import/*, etc.

Q: Multi-tenant ทำยังไง?
A: อ่าน docs/ENTITY_SPEC.md section "Multi-tenant"
   → ใช้ company_id ใน JWT claims + TenantScope middleware

Q: RBAC มี roles อะไรบ้าง?
A: อ่าน internal/rbac/rbac.go
   → SuperAdmin, Admin, Member

Q: Security guidelines มีอะไร?
A: อ่าน docs/SECURITY.md
   → OWASP Top 10, JWT validation, RBAC, GORM parameterized queries
```

### ขอแก้ไข/เพิ่มฟีเจอร์

```
Q: เพิ่ม API endpoint ใหม่
A: 1. อ่าน README.md เพื่อเข้าใจ pattern ปัจจุบัน
   2. อ่าน internal/handler/users.go เป็นตัวอย่าง
   3. สร้าง endpoint ใหม่ตาม pattern เดียวกัน
   4. เพิ่ม middleware ถ้าต้องการ (auth, tenant, permission)
   5. อัพเดท README.md ด้วย

Q: แก้ database schema
A: 1. อ่าน docs/DB_SPEC.md เพื่อเข้าใจ schema
   2. สร้าง migration ใหม่ใน migrations/
   3. รัน go run ./cmd/migrate
   4. อัพเดท docs/DB_SPEC.md

Q: แก้ security issue
A: 1. อ่าน docs/SECURITY.md
   2. หา code ที่เกี่ยวข้อง
   3. แก้ตาม guidelines
   4. ทดสอบ

Q: เพิ่ม permission ใหม่
A: 1. อ่าน internal/rbac/rbac.go
   2. เพิ่ม permission ใน RolePermissions map
   3. อัพเดท middleware/permission.go ถ้าต้องการ
```

---

## 🔧 Quick Reference Commands

```bash
# Run server
go run ./cmd/server

# Run server with environment
set -a && source .env && set +a && go run ./cmd/server

# Run migration
go run ./cmd/migrate

# Build
go build -o server ./cmd/server

# Test
go test ./...

# Docker build
docker build -t account-stock-be .

# Docker run
docker run -p 8080:8080 account-stock-be

# Git status
git status && git log --oneline -5
```

---

## 📋 Environment Variables

| Variable | Required | Default |
|----------|----------|---------|
| `PORT` | No | 8080 |
| `DATABASE_URL` | No* | - |
| `SUPABASE_DB_URL` | No* | - |
| `JWT_SECRET` | Yes (prod) | dev-secret |
| `JWT_ISSUER` | No | account-stock-be |
| `JWT_AUDIENCE` | No | account-stock-fe |
| `CORS_ORIGIN` | No | http://localhost:3000 |

*ต้อง set อย่างน้อย 1 ใน DATABASE_URL หรือ SUPABASE_DB_URL

---

## 🏗️ Project Structure Summary

```
account-stock/
├── cmd/server/           → HTTP server
├── cmd/migrate/         → Database migration
├── internal/
│   ├── auth/            → JWT, password, context
│   ├── database/        → GORM connection
│   ├── handler/        → 12 API handlers
│   ├── middleware/     → Auth, tenant, permission, cors, secure
│   ├── model/          → User, Company, Shop
│   └── rbac/           → Role-based access control
├── migrations/          → 14 migration files
└── docs/               → Documentation
```

---

## ⚠️ Common Issues & Solutions

### Connection Pool Error (Supabase)
- **Error:** `prepared statement "s0" already exists` (PostgreSQL 42P05)
- **Solution:** เติม `?pgbouncer=true` ใน DATABASE_URL

### JWT Validation Failed
- **Error:** 401 Unauthorized
- **Solution:** ตรวจสอบ JWT_SECRET, JWT_ISSUER, JWT_AUDIENCE ตรงกัน

### CORS Error
- **Error:** CORS policy blocked
- **Solution:** ตั้ง CORS_ORIGIN ให้ตรงกับ frontend URL

### Migration Failed
- **Error:** Migration failed
- **Solution:** ตรวจสอบ DATABASE_URL, รันด้วยสิทธิ์ที่ถูกต้อง
