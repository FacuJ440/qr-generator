# QR Code Generator — Static & Dynamic

A full-stack application for generating, managing, and tracking QR codes. Built with **NestJS**, **React**, **TypeScript**, **PostgreSQL**, and **Tailwind CSS**.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Static vs Dynamic QR Codes](#static-vs-dynamic-qr-codes)
- [How Redirection Works](#how-redirection-works)
- [Getting Started](#getting-started)
  - [Docker (Recommended)](#docker-recommended)
  - [Manual Setup](#manual-setup)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Security Considerations](#security-considerations)
- [Scalability Notes](#scalability-notes)

---

## Features

### QR Management
- **Static QR**: Encodes content directly (URL, text, WiFi, vCard, email, phone, SMS). Immutable after creation.
- **Dynamic QR**: Encodes a short URL (`https://midominio.com/r/abc123`) that redirects to the real destination stored in the database. Editable target, title, status, and style without reprinting.
- Visual customization: foreground/background color, error correction level, margin, width.
- Export as PNG or SVG.
- Archive (soft delete) or permanent delete.
- List with filters (type, status, category, search) and sorting by scan count.

### Redirection & Tracking (Dynamic only)
- Public endpoint `GET /r/:shortCode` → looks up destination, records scan event, redirects (HTTP 302).
- Tracks: timestamp, IP, user-agent, device type, browser, OS, referrer.
- Inactive/expired QRs redirect to a notice page.
- Rate limiting on the redirect endpoint.

### Analytics
- Total scans per QR.
- Scans over time (line chart).
- Breakdown by device, browser, OS, country.
- CSV export.

### Authentication
- JWT + refresh tokens.
- Each user manages only their own QR codes.
- Role system ready (user/admin).

---

## Architecture

```
┌─────────────┐     ┌──────────────────────────────────────────┐     ┌────────────┐
│  React SPA  │────▶│  NestJS API                               │────▶│ PostgreSQL │
│  (Vite)     │     │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │     │            │
│             │◀────│  │ Auth │ │ QR   │ │ Red. │ │ Anly │    │     │            │
│             │     │  └──────┘ └──────┘ └──────┘ └──────┘    │     │            │
└─────────────┘     └──────────────────────────────────────────┘     └────────────┘
```

**ORM Choice: TypeORM** — chosen over Prisma for native NestJS integration via `@nestjs/typeorm`, decorator-based entities that work with NestJS DI, and built-in migration support.

**QR Generation: Backend** — QR images are generated server-side using the `qrcode` library. This ensures consistent output across clients, supports SVG/PNG export, and keeps style configuration centralized. The trade-off is slightly higher server CPU usage, but QR generation is fast and lightweight.

---

## Tech Stack

| Layer       | Technology                                      |
|-------------|-------------------------------------------------|
| Backend     | NestJS 10, TypeScript (strict), TypeORM         |
| Database    | PostgreSQL 16                                   |
| Frontend    | React 18, TypeScript (strict), Vite 5           |
| Styling     | Tailwind CSS 3                                  |
| State       | TanStack React Query 5                          |
| Charts      | Recharts                                        |
| Auth        | JWT + Refresh Tokens, Passport                  |
| QR Library  | `qrcode` (backend), `qrcode` (frontend preview) |
| Docs        | Swagger / OpenAPI                               |
| Container   | Docker + docker-compose                         |

---

## Project Structure

```
qr-generator/
├── docker-compose.yml
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env / .env.example
│   └── src/
│       ├── main.ts                    # Entry point, Swagger, Helmet, CORS
│       ├── app.module.ts              # Root module
│       ├── data-source.ts             # TypeORM CLI data source
│       ├── common/
│       │   ├── decorators/            # @Public, @CurrentUser
│       │   ├── filters/               # Global exception filter
│       │   ├── guards/                # JWT auth guard
│       │   └── interceptors/          # Logging interceptor
│       ├── users/
│       │   ├── user.entity.ts
│       │   ├── users.module.ts
│       │   ├── users.service.ts
│       │   └── users.controller.ts
│       ├── auth/
│       │   ├── auth.module.ts
│       │   ├── auth.service.ts
│       │   ├── auth.controller.ts
│       │   ├── jwt.strategy.ts
│       │   └── dto/auth.dto.ts
│       ├── qr-codes/
│       │   ├── qr-code.entity.ts
│       │   ├── qr-static-content.entity.ts
│       │   ├── qr-dynamic-content.entity.ts
│       │   ├── qr-codes.module.ts
│       │   ├── qr-codes.service.ts
│       │   ├── qr-codes.controller.ts
│       │   ├── qr-codes.service.spec.ts
│       │   └── dto/qr-code.dto.ts
│       ├── redirect/
│       │   ├── redirect.module.ts
│       │   ├── redirect.service.ts
│       │   └── redirect.controller.ts
│       ├── analytics/
│       │   ├── qr-scan.entity.ts
│       │   ├── analytics.module.ts
│       │   ├── analytics.service.ts
│       │   └── analytics.controller.ts
│       └── migrations/
│           └── 1710000000000-Init.ts
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    ├── .env
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css
        ├── types/index.ts
        ├── lib/
        │   ├── api.ts                 # Axios client with interceptors
        │   └── api-services.ts        # API service functions
        ├── context/AuthContext.tsx
        ├── components/
        │   ├── Layout.tsx
        │   └── ui/
        │       ├── Button.tsx
        │       ├── Input.tsx
        │       ├── Modal.tsx
        │       └── Badge.tsx
        └── pages/
            ├── LoginPage.tsx
            ├── RegisterPage.tsx
            ├── DashboardPage.tsx
            ├── CreateQrPage.tsx
            ├── QrDetailPage.tsx
            ├── ExpiredPage.tsx
            └── NotFoundPage.tsx
```

---

## Static vs Dynamic QR Codes

### Static QR Code

A static QR code encodes the **final content** directly into the QR image.

```
┌──────────┐         ┌──────────────────┐
│  QR Code │───────▶│  https://site.com │  (content is in the QR itself)
└──────────┘         └──────────────────┘
```

- **Use cases:** WiFi passwords, contact cards (vCard), permanent URLs, plain text.
- **Pros:** No server needed to resolve, works offline, fastest to scan.
- **Cons:** Cannot change the destination without generating a new QR. No analytics.
- **Supported categories:** URL, text, WiFi, vCard, email, phone, SMS.

### Dynamic QR Code

A dynamic QR code encodes a **short URL** that redirects to the real destination.

```
┌──────────┐         ┌─────────────────────┐         ┌──────────────────────┐
│  QR Code │───────▶│  /r/abc123 (server) │───────▶│  https://real-site.com│
└──────────┘         └─────────────────────┘         └──────────────────────┘
                      (records scan, then 302)
```

- **Use cases:** Marketing campaigns, menus, promotions — anything where the destination may change.
- **Pros:** Change destination without reprinting. Full analytics (scans, devices, locations). Pause/expire.
- **Cons:** Requires server to resolve. Slightly slower (one extra HTTP redirect).

---

## How Redirection Works

1. User scans a dynamic QR code with their phone.
2. The QR contains a short URL like `https://midominio.com/r/abc123`.
3. The backend `GET /r/:shortCode` endpoint:
   - Looks up `abc123` in the `qr_dynamic_content` table.
   - Checks if the QR is `active` and not expired.
   - **Asynchronously** records a scan event (IP, user-agent, device, browser, OS, referrer).
   - Increments the `scan_count` counter.
   - Returns an HTTP **302 redirect** to the real `target_url`.
4. If the QR is inactive/expired, redirects to `/expired` notice page.
5. Analytics are available via `GET /analytics/:qrCodeId`.

---

## Getting Started

### Docker (Recommended)

```bash
# Clone and start everything
docker-compose up --build

# Services:
# - PostgreSQL  →  localhost:5432
# - Backend API  →  localhost:3000
# - Frontend     →  localhost:5173
# - Swagger docs →  http://localhost:3000/api/docs
```

### Manual Setup

#### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- npm

#### Backend

```bash
cd backend
cp .env.example .env    # Edit with your DB credentials
npm install

# Run migrations
npm run migration:run

# Start dev server
npm run start:dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## API Documentation

Once the backend is running, visit **http://localhost:3000/api/docs** for interactive Swagger docs.

### Key Endpoints

| Method | Path                        | Description                          | Auth |
|--------|-----------------------------|--------------------------------------|------|
| POST   | `/auth/register`            | Register new user                    | No   |
| POST   | `/auth/login`               | Login                                | No   |
| POST   | `/auth/refresh`             | Refresh access token                 | No   |
| POST   | `/auth/logout`              | Logout                               | Yes  |
| GET    | `/users/me`                 | Get profile                          | Yes  |
| POST   | `/qr-codes`                 | Create QR code                       | Yes  |
| GET    | `/qr-codes`                 | List QR codes (with filters)         | Yes  |
| GET    | `/qr-codes/:id`             | Get single QR code                   | Yes  |
| PUT    | `/qr-codes/:id`             | Update QR code                       | Yes  |
| DELETE | `/qr-codes/:id`             | Delete QR code                       | Yes  |
| PATCH  | `/qr-codes/:id/archive`     | Archive QR code                      | Yes  |
| GET    | `/qr-codes/:id/image`       | Download QR image (PNG/SVG)          | Yes  |
| GET    | `/r/:shortCode`             | Public redirect + tracking           | No   |
| GET    | `/analytics/:qrCodeId`      | Analytics summary                    | Yes  |
| GET    | `/analytics/:qrCodeId/export` | Export scans as CSV               | Yes  |

---

## Database Schema

```
users
  id (UUID, PK)
  email (UNIQUE)
  password_hash
  name
  plan (enum: free | pro | enterprise)
  role (enum: user | admin)
  refresh_token_hash
  created_at, updated_at

qr_codes
  id (UUID, PK)
  user_id (FK → users, CASCADE)
  type (enum: static | dynamic)
  category (enum: url | text | wifi | vcard | email | phone | sms)
  title
  style_config (JSONB: colors, logo, eye shape, error correction, margin, width)
  status (enum: active | paused | expired | archived)
  is_archived (boolean)
  created_at, updated_at

qr_static_content
  id (UUID, PK)
  qr_code_id (FK → qr_codes, UNIQUE, CASCADE)
  content (JSONB — varies by category)

qr_dynamic_content
  id (UUID, PK)
  qr_code_id (FK → qr_codes, UNIQUE, CASCADE)
  short_code (UNIQUE, indexed)
  target_url (TEXT)
  expires_at (timestamptz, nullable)
  scan_count (bigint)

qr_scans
  id (UUID, PK)
  qr_code_id (FK → qr_codes, CASCADE)
  scanned_at (timestamptz, indexed)
  ip_address
  user_agent
  device_type (enum: mobile | tablet | desktop | unknown)
  browser, os, country, city
  referrer
  created_at
```

**Indexes:** `qr_scans(qr_code_id, scanned_at)` composite index for efficient analytics queries. `qr_dynamic_content(short_code)` for fast redirect lookups.

---

## Security Considerations

- **Helmet** for security headers (CSP, X-Frame-Options, etc.).
- **CORS** configured with explicit origin.
- **Input validation** via `class-validator` on all DTOs.
- **URL validation** — only `http`/`https` protocols allowed for dynamic QR targets (prevents open redirect).
- **Password hashing** with bcrypt (12 rounds).
- **JWT** with short-lived access tokens (15min) + refresh tokens (7d).
- **Rate limiting** via `@nestjs/throttler` on redirect endpoint.
- **Payload size limits** (10MB max body).
- **SQL injection** prevented by TypeORM parameterized queries.
- **User isolation** — every query is scoped to `userId` from JWT.

---

## Scalability Notes

For millions of scans:

1. **Async scan tracking** — scan events are recorded fire-and-forget. For high volume, move to a message queue (BullMQ/Redis) and worker process.
2. **Composite indexes** on `qr_scans(qr_code_id, scanned_at)` for fast analytics queries.
3. **Counter cache** — `scan_count` on `qr_dynamic_content` avoids `COUNT(*)` on every list query.
4. **Read replicas** — analytics queries can hit a Postgres read replica.
5. **CDN** — serve QR images from a CDN with cache headers.
6. **Partitioning** — partition `qr_scans` by `scanned_at` for time-series efficiency.
7. **GeoIP** — integrate MaxMind GeoIP2 for country/city resolution (currently null).
