# RouteLog

**RouteLog** is a full-stack mountain activity journal for Greek mountaineering clubs. Members log hiking ascents, rock climbing sessions, and expeditions abroad. The application enforces EOOA scoring rules, distinguishes official (club-recorded) from personal entries, and provides a club-admin dashboard with Excel export.

The UI is in Greek.

Developed as a thesis project at the Department of Electrical and Computer Engineering, University of Patras.

**Deployment URL (frontend):** `https://routelog-red.vercel.app`  
**Backend API URL:** set in Vercel as `VITE_API_URL` :`https://routelog-7i2o.onrender.com`

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 6, React Router 7, Tailwind CSS 4 |
| Backend | NestJS 10, Prisma 5, PostgreSQL 16 |
| Auth | JWT access tokens (Bearer) + httpOnly refresh cookies |
| Dev database | Docker / Docker Compose |

---

## Requirements

- **Node.js** 20 or later
- **npm** (bundled with Node)
- **Docker Desktop** (or Docker Engine + Compose plugin)
- **Git**

---

## Local setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd RouteLog
```

### 2. Install dependencies

```bash
# Frontend (root)
npm install

# Backend
cd server && npm install && cd ..
```

### 3. Configure backend environment

```bash
cd server
cp .env.example .env
```

The defaults in `.env.example` match the Docker Compose database credentials and work out of the box for local development. Edit `server/.env` only if you need to change ports or secrets.

For the **frontend**, create a `.env` or `.env.local` in the repository root if the API is not on the default dev origin:

| Variable | Example | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3001` | Backend base URL (omit trailing slash). Required for production builds pointing at Render. |

### 4. Start the database

From the repository root:

```bash
docker compose up -d
```

This starts a PostgreSQL 16 container on port `5432`. Wait a few seconds for it to become healthy before continuing.

### 5. Run migrations

```bash
cd server
npm run prisma:migrate:dev
```

### 6. Seed demo data

```bash
npm run prisma:seed
```

This creates the demo club, three demo users, grade mappings, and club memberships (see [Demo users](#demo-users) below).

### 7. Start the backend

```bash
# Still inside /server
npm run start:dev
```

The API runs on `http://localhost:3001`.

### 8. Start the frontend

Open a second terminal from the repository root:

```bash
npm run dev
```

The app opens at `http://localhost:5173`.

---

## Environment variables

All variables live in `server/.env` (copy from `server/.env.example`).

| Variable | Example | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://routelog:routelog@localhost:5432/routelog_dev` | Prisma connection string |
| `JWT_SECRET` | `change-me-in-production` | Signs access tokens — use a long random string in production |
| `JWT_EXPIRES_IN` | `1h` | Access token lifetime |
| `JWT_REFRESH_SECRET` | `change-me-refresh-secret-in-production` | Signs refresh tokens — must differ from `JWT_SECRET` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token lifetime (httpOnly cookie) |
| `PORT` | `3001` | NestJS listen port |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated allowed frontend origins |

> **Never commit `.env` to version control.**

---

## Demo users

Seeded by `npm run prisma:seed`. All passwords are `password123`.

| Email | Role | Access |
|---|---|---|
| `member@example.com` | Club member | `/app` — full activity journal |
| `admin@example.com` | Club admin | `/app` + `/admin` — admin dashboard and export |
| `superadmin@example.com` | Super admin | `/app` + `/admin` — platform-wide administration |

- `member@example.com` and `admin@example.com` are members of **ΕΟΣ Πατρών**.
- `superadmin@example.com` has no club membership by default. Log in as this user to test the no-club flow (personal-only records, club declaration from profile).
- Any new registered user also starts with no club and must declare membership from their profile page.

---

## Features

| Feature | Notes |
|---|---|
| Register / login / logout | Email + password; JWT access token + httpOnly refresh cookie |
| Session persistence | Refresh cookie silently restores session on page reload; proactive background refresh prevents mid-session expiry |
| Secure logout | `localStorage` flag prevents a stale refresh cookie from restoring a previous session |
| Profile — club declaration | User can join a club from the profile dropdown |
| Activity creation — hiking | EOOA hiking / ski mountaineering form with full field validation |
| Activity creation — climbing | Route combobox (keyboard-navigable), difficulty scale (UIAA / Alpine / French), mixed/ice |
| Activity creation — expedition | Expedition abroad form with organization coefficient |
| Official vs personal records | Official entries require club membership and follow EOOA rules; helper texts adapt per mode |
| Live EOOA points preview | Debounced preview updates as the user fills the form (backend scoring) |
| EOOA scoring | Backend-only; hiking, climbing, expedition formulas per EOOA rules |
| Activity history | Filterable list; climbing sessions grouped by date and field |
| Activity detail | Full detail view with edit / delete actions |
| Edit activity | Per-category edit forms; official rules re-validated on save |
| Delete activity | Confirmation modal; hard delete with transactional detail cleanup |
| Climbing route catalog | Searchable routes with difficulty, altitude, sector; add new routes inline |
| Admin dashboard | Club activity overview, member list, per-user stats |
| Excel export | EOOA-format `.xlsx`; custom filename `routelog-<club>-ΔΡΑΣΕΙΣ-<year>.xlsx`; Συμμετέχοντες column includes submitter name |
| In-app help page | `/app/help` — brief usage guide for end users |

---

## Useful commands

### Frontend (root)

```bash
npm run dev        # Start dev server with hot reload
npm run build      # Production build (TypeScript check + Vite)
npm run preview    # Preview production build locally
npm run lint       # ESLint
```

### Backend (`server/`)

```bash
npm run start:dev          # Start NestJS with watch mode
npm run build              # Compile TypeScript (nest build)
npm test                   # Run all unit tests (Jest)
npm run test:coverage      # Tests with coverage report

npm run prisma:migrate:dev   # Apply pending migrations (dev)
npm run prisma:migrate:deploy # Apply migrations (production)
npm run prisma:seed          # Seed demo data
npm run prisma:studio        # Open Prisma Studio (DB browser)
npm run prisma:generate      # Regenerate Prisma client after schema change
```

### Docker

```bash
docker compose up -d    # Start PostgreSQL in background
docker compose down     # Stop and remove containers (data volume persists)
docker compose down -v  # Stop and remove containers + data volume (clean slate)
```

---

## Project structure

```
RouteLog/
├── src/                  # Frontend (React / TypeScript)
│   ├── api/              # API client functions
│   ├── app/              # Router, layouts
│   ├── auth/             # AuthContext, token handling
│   ├── components/       # Shared UI, forms, detail, history, admin
│   ├── hooks/            # Custom React hooks (e.g. usePointsPreview)
│   ├── pages/            # Page-level components (app/, admin/, landing/)
│   └── constants/        # Form option lists and labels
├── server/               # Backend (NestJS)
│   ├── prisma/           # Schema, migrations, seed
│   └── src/
│       ├── activities/   # Activity CRUD + preview endpoint
│       ├── auth/         # JWT auth, guards, refresh cookies
│       ├── clubs/        # Club and membership management
│       ├── export/           # Excel export service
│       ├── scoring/          # EOOA scoring formulas and constants
│       └── climbing-routes/  # Climbing routes catalogue API
├── docker-compose.yml    # PostgreSQL dev database
└── docs/                 # Implementation notes and audit docs
```

---

## Deployment

The application is deployed on a free-tier stack:

| Layer | Service |
|---|---|
| Frontend | Vercel |
| Backend | Render (Docker) |
| Database | Supabase (PostgreSQL) |

Documentation:

- `docs/security-and-deployment-summary.md` — concise auth and deployment model  
- `docs/security-and-deployment.md` — full checklist, cookies, CORS, Docker notes  
- `docs/final-implementation-status.md` — MVP scope, limitations, future work  
- `docs/user-testing-findings-updated.md` — user testing issues and fix status  
- `docs/post-user-testing-fixes.md` — technical changelog after testing sessions  

---

## Known limitations (MVP)

- **Refresh tokens are not stored in the database** — revoking a session requires waiting for the refresh token to expire (7 days). Full mitigation requires DB-backed token revocation.
- **No password reset or email verification** — registration completes immediately with no email confirmation.
- **No club membership approval workflow** — users self-declare club membership; admin approval is not implemented.
- **No leave / change club UI** — MVP assumes a single declared club per account.
- **Club membership is one-per-user (MVP)** — the system supports a single primary club per account.
- **Routes catalog covers climbing only** — hiking and expedition route management is planned for a future phase.
- **Render free tier cold-start** — the backend may take ~30 s to respond after inactivity; the login page shows a progress message to inform users.
- **No soft delete for activities** — delete is permanent (transactional hard delete).
- **Admins cannot edit or delete another member’s activities** — only the record owner can.
- **User testing sample was small** (two sessions) — suitable for MVP feedback, not for statistical generalisation; see `docs/user-testing-findings-updated.md`.
