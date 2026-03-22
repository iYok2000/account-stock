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

- **Backend Developers** — พัฒนา Go API สำหรับ account-stock
- **Frontend Developers** — เชื่อมต่อ Go API จาก Next.js
- **DevOps** — Deploy และดูแล server
- **Thai Users** — แม่ค้าออนไลน์ที่ใช้ระบบ inventory/accounting

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
- อย่าเดาว่า API endpoint มีอะไรบ้าง → อ่าน README.md หรือ internal/handler/
- อย่าเดาว่า database schema เป็นยังไง → อ่าน docs/DB_SPEC.md
- อย่าเดาว่า entity เป็นยังไง → อ่าน docs/ENTITY_SPEC.md
- อย่าเดาว่า RBAC เป็นยังไง → อ่าน internal/rbac/rbac.go

✅ ทำแทน: อ่านไฟล์จริงก่อน พร้อมระบุ [Source: path/to/file.go:line]
```

### 3. Cite Sources
```
Format: [Source: path/to/file.go:line]

Example:
- "GET /api/users requires users:read permission"
  [Source: README.md:33]

- "company_id is required for multi-tenant scope"
  [Source: docs/ENTITY_SPEC.md:15]

- "SuperAdmin can do everything"
  [Source: internal/rbac/rbac.go:20]
```

### 4. Label Uncertainty
```
ถ้าไม่แน่ใจ → ระบุเป็น **ASSUMPTION** + TODO

Example:
## API Endpoint for User Update

**ASSUMPTION:** Missing PUT /api/users/{id} endpoint
**TODO:** Check internal/handler/users.go for existing endpoints
**Source:** User requested, not verified in current code
```

### 5. TypeScript สำหรับ Frontend, Go สำหรับ Backend
```
- เขียน Go code ใน backend เท่านั้น (internal/, cmd/)
- เขียน TypeScript/React ใน frontend เท่านั้น (accountstock-frontend)
- ห้ามผสม tech stack
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
| Language | Go 1.22+ |
| ORM | GORM |
| Database | PostgreSQL (Supabase) |
| Auth | JWT Bearer |
| RBAC | Role-based Access Control |
| Multi-tenant | company_id scope |
| Migration | SQL migrations |
| Deploy | Fly.io |

---

## โครงสร้างไฟล์สำคัญ

```
account-stock/
├── cmd/
│   ├── server/main.go           → HTTP server entrypoint
│   └── migrate/main.go          → Database migration tool
├── internal/
│   ├── auth/
│   │   ├── jwt.go               → JWT signing/verification
│   │   ├── password.go          → Password hashing
│   │   └── context.go           → Auth context extraction
│   ├── database/
│   │   └── database.go           → GORM connection
│   ├── handler/
│   │   ├── auth.go              → Login, register, auth endpoints
│   │   ├── users.go              → User CRUD endpoints
│   │   ├── shops.go              → Shop endpoints
│   │   ├── import.go             → Import endpoints
│   │   ├── inventory.go          → Inventory endpoints
│   │   ├── dashboard.go          → Dashboard endpoints
│   │   ├── affiliate.go          → Affiliate tracking
│   │   ├── analytics.go          → Analytics endpoints
│   │   ├── consent.go            → Consent management
│   │   └── self.go               → Self profile endpoints
│   ├── middleware/
│   │   ├── auth.go               → JWT middleware (verify token)
│   │   ├── tenant.go             → Multi-tenant middleware (company_id)
│   │   ├── permission.go         → RBAC middleware (check permissions)
│   │   ├── cors.go               → CORS handling
│   │   └── secure.go             → Security headers (helmet)
│   ├── model/
│   │   ├── user.go               → User model (id, email, password_hash, role, tier, company_id, shop_id)
│   │   ├── company.go            → Company model (id, name, settings)
│   │   └── shop.go               → Shop model (id, name, company_id)
│   └── rbac/
│       └── rbac.go               → RBAC definitions (roles, permissions, tiers)
├── migrations/
│   ├── 000001_init.up.sql       → Initial schema (users, companies, shops)
│   ├── 000002_*.sql             → Add phone column
│   ├── 000003_*.sql             → Shops and user-shop relations
│   ├── 000005_*.sql             → Import results table
│   ├── 000006_*.sql             → SKU row import
│   ├── 000007_*.sql             → Soft delete
│   ├── 000008_*.sql             → Affiliate SKU
│   ├── 000009_*.sql             → Affiliate SKU enrich
│   ├── 000010_*.sql             → Default company
│   ├── 000011_*.sql            → Company ID for shops
│   ├── 000012_*.sql            → User ID for affiliates
│   ├── 000013_*.sql            → Drop import_results
│   └── 000014_*.sql            → Affiliate date default
├── docs/
│   ├── MANIFEST.json            → File index (START HERE)
│   ├── DB_SPEC.md               → Database schema (GORM models)
│   ├── ENTITY_SPEC.md           → Entity definitions (User, Company, Shop)
│   ├── SECURITY.md              → Security guidelines (OWASP Top 10)
│   ├── SUPABASE.md              → Supabase connection guide
│   ├── DEPLOY.md                → Deployment guide (Fly.io)
│   ├── PRODUCTION_READINESS.md  → Production checklist
│   └── feature/
│       ├── 01-auth.md           → Authentication spec
│       ├── 02-users.md          → Users feature spec
│       ├── 03-import.md         → Import feature spec
│       └── 04-shops.md          → Shops feature spec
├── .env.example                 → Environment variables template
├── Dockerfile                   → Docker build
├── fly.toml                    → Fly.io config
├── go.mod                      → Go module
├── README.md                   → Quick start
├── AGENTS.md                  → AI agents documentation
└── project-specific_context.md → Project-specific context
```

---

## API Endpoints

### Authentication
| Method | Path | Auth | Permission | Description |
|--------|------|------|------------|-------------|
| POST | `/api/auth/login` | No | - | Login with email/password |
| POST | `/api/auth/register` | No | - | Register new user |
| GET | `/api/auth/me` | JWT | - | Get current user context |

### Users
| Method | Path | Auth | Permission | Description |
|--------|------|------|------------|-------------|
| GET | `/api/users` | JWT | `users:read` | List users (SuperAdmin only) |
| GET | `/api/users/:id` | JWT | `users:read` | Get user by ID |
| POST | `/api/users` | JWT | `users:create` | Create user |
| PUT | `/api/users/:id` | JWT | `users:update` | Update user |
| DELETE | `/api/users/:id` | JWT | `users:delete` | Delete user |

### Shops
| Method | Path | Auth | Permission | Description |
|--------|------|------|------------|-------------|
| GET | `/api/shops` | JWT | `shops:read` | List shops |
| GET | `/api/shops/:id` | JWT | `shops:read` | Get shop by ID |
| POST | `/api/shops` | JWT | `shops:create` | Create shop |
| PUT | `/api/shops/:id` | JWT | `shops:update` | Update shop |
| DELETE | `/api/shops/:id` | JWT | `shops:delete` | Delete shop |

### Import
| Method | Path | Auth | Permission | Description |
|--------|------|------|------------|-------------|
| POST | `/api/import/order-transaction` | JWT | `orders:create` | Import order-transaction |

### Dashboard
| Method | Path | Auth | Permission | Description |
|--------|------|------|------------|-------------|
| GET | `/api/dashboard/summary` | JWT | `dashboard:read` | Get dashboard summary |

### Affiliate
| Method | Path | Auth | Permission | Description |
|--------|------|------|------------|-------------|
| GET | `/api/affiliate/stats` | JWT | `affiliate:read` | Get affiliate stats |

### Inventory
| Method | Path | Auth | Permission | Description |
|--------|------|------|------------|-------------|
| GET | `/api/inventory` | JWT | `inventory:read` | List inventory |
| POST | `/api/inventory` | JWT | `inventory:create` | Create inventory |
| PUT | `/api/inventory/:id` | JWT | `inventory:update` | Update inventory |
| DELETE | `/api/inventory/:id` | JWT | `inventory:delete` | Delete inventory |

### Analytics
| Method | Path | Auth | Permission | Description |
|--------|------|------|------------|-------------|
| GET | `/api/analytics/...` | JWT | `analytics:read` | Various analytics endpoints |

---

## RBAC (Role-Based Access Control)

### Roles
| Role | Description |
|------|-------------|
| `SuperAdmin` | ทำได้ทุกอย่าง ทุก company |
| `Admin` | ทำได้ทุกอย่างใน company ตัวเอง |
| `Member` | ใช้งานได้ตาม permission ที่ได้รับ |

### Tiers
| Tier | Description |
|------|-------------|
| `free` | Free tier |
| `pro` | Pro tier |
| `enterprise` | Enterprise tier |

### Permissions
```
users:read, users:create, users:update, users:delete
shops:read, shops:create, shops:update, shops:delete
orders:create, orders:read, orders:update, orders:delete
inventory:read, inventory:create, inventory:update, inventory:delete
dashboard:read
affiliate:read
analytics:read
```

---

## Multi-tenant Architecture

### Scope
- ทุก request ต้องมี `company_id` จาก JWT claims
- ใช้ `TenantScope` middleware เพื่อ filter data ตาม `company_id`
- User อาจมี `shop_id` สำหรับ shop-specific data

### Flow
```
1. Request → JWT Middleware (verify token)
2. JWT → Extract user_id, role, tier, company_id, shop_id
3. Tenant Middleware → Add company_id to context
4. Permission Middleware → Check role has permission
5. Handler → Use company_id from context for queries
```

### Query Pattern (GORM)
```go
// ✅ Correct: ใช้ company_id จาก context
db.Where("company_id = ?", companyID)

// ❌ Wrong: ใช้ company_id จาก user input
db.Where("company_id = ?", userInputCompanyID)
```

---

## Security Guidelines

### OWASP Top 10 Compliance
1. **A01: Broken Access Control** - ใช้ RBAC middleware ทุก endpoint
2. **A02: Cryptographic Failures** - ใช้ bcrypt สำหรับ password
3. **A03: Injection** - ใช้ GORM parameterized queries (ห้าม string concatenation)
4. **A04: Insecure Design** - ใช้ allowlist validation
5. **A05: Security Misconfiguration** - ใช้ secure headers middleware
6. **A06: Vulnerable Components** - อัพเดท dependencies สม่ำเสมอ
7. **A07: Auth Failures** - JWT with expiration, rate limiting
8. **A08: Data Failures** - RLS on Supabase
9. **A09: Logging Failures** - Log important events
10. **A10: SSRF** - Validate URLs

### JWT Security
- **Algorithm:** RS256 (RSA) or HS256 (HMAC)
- **Expiration:** 24 hours (configurable)
- **Claims required:** sub, role, tier, company_id
- **Claims optional:** display_name, shop_id

### Error Responses
- ใช้ fixed messages เท่านั้น (ไม่ leak user input)
- Log errors แต่ไม่แสดง stack trace ใน response

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 8080 | Server port |
| `DATABASE_URL` | No* | - | PostgreSQL connection string |
| `SUPABASE_DB_URL` | No* | - | Supabase connection string |
| `JWT_SECRET` | Yes (prod) | dev-secret | JWT signing secret |
| `JWT_ISSUER` | No | account-stock-be | JWT issuer |
| `JWT_AUDIENCE` | No | account-stock-fe | JWT audience |
| `CORS_ORIGIN` | No | http://localhost:3000 | Allowed CORS origins |

*ต้อง set อย่างน้อย 1 ใน DATABASE_URL หรือ SUPABASE_DB_URL

---

## Quick Commands

```bash
# Run server (development)
go run ./cmd/server

# Run server with environment
set -a && source .env && set +a && go run ./cmd/server

# Run migration
go run ./cmd/migrate

# Build binary
go build -o server ./cmd/server

# Run tests
go test ./...

# Docker build
docker build -t account-stock-be .

# Docker run
docker run -p 8080:8080 account-stock-be
```

---

## Database Schema

### Users Table
```sql
- id (UUID, PK)
- email (VARCHAR, unique)
- password_hash (VARCHAR)
- display_name (VARCHAR)
- role (VARCHAR) -- SuperAdmin, Admin, Member
- tier (VARCHAR) -- free, pro, enterprise
- company_id (UUID, FK)
- shop_id (UUID, FK, nullable)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- deleted_at (TIMESTAMP, soft delete)
```

### Companies Table
```sql
- id (UUID, PK)
- name (VARCHAR)
- settings (JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Shops Table
```sql
- id (UUID, PK)
- name (VARCHAR)
- company_id (UUID, FK)
- settings (JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- deleted_at (TIMESTAMP, soft delete)
```

---

## Example Data Flow

### Login Flow
```
1. POST /api/auth/login {email, password}
2. Handler: Find user by email
3. Handler: Verify password with bcrypt
4. Handler: Generate JWT with claims (sub, role, tier, company_id, shop_id)
5. Response: {token, user}
```

### Create Shop Flow (Admin)
```
1. POST /api/shops {name, ...}
2. Auth Middleware: Verify JWT
3. Permission Middleware: Check shops:create permission
4. Tenant Middleware: Add company_id from JWT to context
5. Handler: Create shop with company_id from context
6. Response: {shop}
```

### Get Dashboard Flow
```
1. GET /api/dashboard/summary
2. Auth Middleware: Verify JWT
3. Permission Middleware: Check dashboard:read permission
4. Tenant Middleware: Extract company_id from JWT
5. Handler: Query dashboard data with company_id filter
6. Response: {summary}
```

---

## Common Issues & Solutions

### Connection Pool Error (Supabase)
- **Error:** `prepared statement "s0" already exists` (PostgreSQL 42P05)
- **Solution:** เติม `?pgbouncer=true` ใน DATABASE_URL

### JWT Validation Failed
- **Error:** 401 Unauthorized
- **Solution:** ตรวจสอบ JWT_SECRET, JWT_ISSUER, JWT_AUDIENCE ตรงกัน

### CORS Error
- **Error:** CORS policy blocked
- **Solution:** ตั้ง CORS_ORIGIN ให้ตรงกับ frontend URL

---

## เมื่อแก้ไข code ให้ update docs ด้วย

| เมื่อ | Update |
|------|--------|
| เพิ่ม/แก้ API endpoint | README.md + docs/MANIFEST.json |
| เปลี่ยน schema | docs/DB_SPEC.md + migration |
| เพิ่ม feature | docs/feature/*.md + docs/MANIFEST.json |
| แก้ security | docs/SECURITY.md |
| แก้ RBAC | internal/rbac/rbac.go + docs/MANIFEST.json |

---

## External Resources

- **GORM Docs:** https://gorm.io/docs/
- **JWT Library:** https://github.com/golang-jwt/jwt
- **Supabase:** https://supabase.com/docs
- **Fly.io:** https://fly.io/docs/
- **OWASP Top 10:** https://owasp.org/www-project-top-ten/
