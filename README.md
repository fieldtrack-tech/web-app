# FieldTrack Web

Frontend application for FieldTrack operations, built with Next.js App Router.

Source audit: 2026-11-24. The local production build and 11 selfie helper tests
pass; this is not a live-authentication, end-to-end or production-security audit pass.

## Overview

This app provides role-aware experiences for employees and admins.

Implemented capabilities include:

- employee attendance and session history
- live-camera selfie/GPS attendance and employee earnings (`/employee/earnings`)
- preset warehouses, visit rates, monthly basic pay, attendance reports and payment history (`/admin/field`)
- on-duty live fleet and individual employee maps (`/admin/tracking`)
- expense submission and status tracking
- admin dashboards, employee management, analytics, queue/system views, and webhook tooling
- authenticated admin session and expense events (`/admin/events`)

## Tech Stack

- Next.js 15 (App Router)
- React 18
- TypeScript
- TanStack React Query v5
- Supabase SSR/Auth (`@supabase/ssr`, `@supabase/supabase-js`)
- Tailwind CSS + tokenized design system
- Leaflet/React-Leaflet
- Recharts
- Zod

## Architecture Summary

Primary folders:

- `src/app`: route tree and layouts
- `src/components`: shared UI and feature components
- `src/contexts`: auth/session context
- `src/hooks/queries`: React Query hooks and query key definitions
- `src/lib/api`: typed API modules and endpoint constants
- `src/lib/query-client.ts`: global query/mutation defaults

Auth and role model:

- Supabase session is source of auth state
- middleware guards protected routes (`src/middleware.ts`)
- admin pages require `role === ADMIN`
- protected layout enables admin SSE only for admin users

## Environment

Required variables:

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Optional proxy variable:

- `API_DESTINATION_URL` (used when base URL is `/api/proxy`)

## Local Development

```bash
npm install
npm run dev
```

Scripts:

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run type-check`
- `npm run test:selfie` (IST boundaries, visible image footer and GPS EXIF helpers)
- `npm run test:proxy` (upstream SSE streaming, disconnect cleanup and ordinary proxy responses)

The deployment workflow checks the production dependency graph with `npm audit --omit=dev --audit-level=high`.

## Data Layer Behavior

React Query defaults (`src/lib/query-client.ts`):

- `staleTime`: 60s global default
- `gcTime`: 5m
- retries disabled for `401/403`, single retry for other failures
- global query/mutation error event dispatch (`fieldtrack:query-error`)
- recording a payment can retry with the same request ID after a transient failure

HTTP client behavior (`src/lib/api/client.ts`):

- bearer token injection from Supabase session
- signing out or changing user, organization, or role clears the query cache and remounts protected views
- deduplicated token refresh on 401
- request timeout and typed network errors
- envelope and paginated response parsing

## Role-Based UI

- Employee navigation: dashboard, sessions, expenses, profile, leaderboard
- Admin navigation: dashboard, tracking/map, sessions, employees, analytics, expenses, monitoring, queues, retry intents, webhooks, API keys, system health

Company setup uses INR and IST (UTC+05:30). Admins configure sites and monthly
basic pay in `/admin/field`. Reports include daily, weekly, monthly and custom
periods. Visit pay follows verified visits. Basic pay is counted once for each
complete calendar month in the selected period. Admins can review outstanding
pay and record payments after they are made. Employees see their own reports
in `/employee/earnings`.

Camera check-in uses a live browser camera, fresh GPS, a visible GPS/time footer
and embedded JPEG EXIF. It requires HTTPS or localhost, camera and location
permission, and the updated API. An open browser tab sends on-duty GPS for the
shift it started while the browser permits location updates. The Android app
supports tracking while working outside the browser. The admin map polls every
10 seconds and labels fixes at least one minute old as delayed.

## API Contract Usage

The frontend calls API endpoints from `src/lib/api/endpoints.ts` and domain modules in `src/lib/api/*`.

Contract-level details are documented in `API_USAGE.md`.

## Additional Docs

Company feature setup and deployment requirements are in `api/docs/FIELD_OPERATIONS.md`
in the parent workspace. Apply the API's field-operations migration and deploy
updated clients together; old no-body attendance check-in requests are rejected.

- `UI_ARCHITECTURE.md`
- `API_USAGE.md`
