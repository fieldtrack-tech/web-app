# FieldTrack — Web

**FieldTrack Web** is a Next.js 14 frontend for managing field workforce operations. It provides live GPS tracking, session management, expense tracking and approvals, attendance analytics, and a full admin portal.

> **Repository:** `fieldtrack-tech/web`  
> **Backend (API):** [`fieldtrack-tech/api`](https://github.com/fieldtrack-tech/api)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + custom CSS design system |
| Auth | Supabase Auth (`@supabase/ssr`, JWT) |
| Server State | TanStack Query v5 |
| Maps | Leaflet / React-Leaflet (OpenStreetMap) |
| Charts | Recharts |
| Schema Validation | Zod |

---

## Architecture

```
Browser
  └── fieldtrack-tech/web  (this repo — Next.js, Vercel)
        └── NEXT_PUBLIC_API_BASE_URL
              └── fieldtrack-tech/api  (Express/Node.js, separate deployment)
                    └── Supabase (PostgreSQL + Auth)
```

This frontend is **fully standalone**. It communicates with the backend exclusively via `NEXT_PUBLIC_API_BASE_URL`. There are no shared packages, monorepo dependencies, or direct database access from the frontend.

---

## Prerequisites

- Node.js 18+
- npm 9+
- A running [FieldTrack API](https://github.com/fieldtrack-tech/api) instance
- A Supabase project

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy the example env file and fill in values
cp .env.example .env.local

# 3. Start the dev server (http://localhost:3000)
npm run dev
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and supply values. **Never commit `.env.local`.**

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | ✅ Yes | Backend API base URL (e.g. `https://api.fieldtrack.app` or `/api/proxy`) |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Supabase public anon key |
| `API_DESTINATION_URL` | No | Server-side rewrite target (used with `/api/proxy` proxy mode) |

### Proxy Mode

If your API does not support CORS for the browser origin, set:

```env
NEXT_PUBLIC_API_BASE_URL=/api/proxy
API_DESTINATION_URL=https://api.fieldtrack.app
```

Next.js will rewrite `/api/proxy/:path*` → `API_DESTINATION_URL/:path*` server-side, avoiding CORS entirely.

---

## Scripts

```bash
npm run dev          # Start dev server on port 3000
npm run build        # Production build
npm run start        # Start production server on port 3000
npm run lint         # ESLint
npm run type-check   # TypeScript type check (no emit)
```

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/            # Login page
│   ├── (protected)/       # Authenticated routes
│   │   ├── dashboard/     # Employee home dashboard
│   │   ├── sessions/      # Session history
│   │   ├── expenses/      # Expense claims
│   │   ├── leaderboard/   # Org-wide leaderboard
│   │   ├── profile/       # User profile
│   │   ├── employee/      # Employee self-service views
│   │   └── admin/         # Admin-only section
│   │       ├── dashboard/  # Org KPIs + live map
│   │       ├── tracking/   # Real-time location tracking
│   │       ├── sessions/   # Session management
│   │       ├── employees/  # Employee management
│   │       ├── analytics/  # Org analytics
│   │       ├── expenses/   # Expense approvals
│   │       ├── audit-logs/ # Security audit log (dev only)
│   │       ├── queues/     # Job queue inspector (dev only)
│   │       ├── webhooks/   # Webhook management
│   │       └── monitoring/ # API health monitoring
│   ├── globals.css        # Global CSS + design tokens
│   └── providers.tsx      # TanStack Query + Toast providers
├── components/            # Shared UI components
├── contexts/              # React contexts (AuthContext)
├── hooks/
│   └── queries/           # TanStack Query hooks (per-domain)
├── lib/
│   ├── api/               # Typed API client (per-domain modules)
│   ├── auth/              # Role extraction helpers
│   ├── env.ts             # Zod-validated environment schema
│   ├── query-client.ts    # Global QueryClient configuration
│   └── utils.ts           # Shared utility functions
└── types/                 # Shared TypeScript types
```

---

## Authentication & Authorization

- Auth is handled via **Supabase SSR** with JWT session validation in Next.js middleware.
- Middleware (`src/middleware.ts`) guards all protected routes and enforces role-based redirects.
- Admin routes (`/admin/*`) require `role === "ADMIN"` in the JWT claims.
- Dev-only routes (`/admin/queues`, `/admin/audit-logs`) additionally require `app_metadata.is_dev === true`.

---

## Maps

This project uses **[Leaflet](https://leafletjs.com/)** with **[React-Leaflet](https://react-leaflet.js.org/)** and **OpenStreetMap** tiles for map rendering.

- **No API key required** — OpenStreetMap is free and open-source
- Live fleet tracking and route visualization in real time
- Maps are rendered client-side with dynamic marker clustering
- Tile layers use CARTO's dark theme for consistency with the UI

---

## Development Notes

- The app uses a **custom CSS design system** — no third-party UI library. Design tokens are defined in `globals.css` as CSS custom properties and mapped in `tailwind.config.ts`.
- **TanStack Query** is configured with global error handling, 401 suppression, and exponential backoff in `src/lib/query-client.ts`.
- `@tanstack/react-query-devtools` renders only in `development` mode.
- Environment variables are validated at startup via **Zod** in `src/lib/env.ts`. The app throws early with a clear message if any required variable is missing.

---

## Deployment

Deployed via **[Vercel](https://vercel.com)** with automatic deploys on push to `main`.

**Required Vercel environment variables:**

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Production API URL (or `/api/proxy`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `API_DESTINATION_URL` | *(Required only in proxy mode)* |

For self-hosted deployment:

```bash
npm run build
npm run start
```

