# FieldTrack Web

Frontend application for FieldTrack operations, built with Next.js App Router.

## Overview

This app provides role-aware experiences for employees and admins.

Implemented capabilities include:

- employee attendance and session history
- location route views and tracking-oriented dashboards
- expense submission and status tracking
- admin dashboards, employee management, analytics, queue/system views, and webhook tooling
- real-time admin updates via SSE (`/admin/events`)

## Tech Stack

- Next.js 14 (App Router)
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

## Data Layer Behavior

React Query defaults (`src/lib/query-client.ts`):

- `staleTime`: 60s global default
- `gcTime`: 5m
- retries disabled for `401/403`, single retry for other failures
- global query/mutation error event dispatch (`fieldtrack:query-error`)

HTTP client behavior (`src/lib/api/client.ts`):

- bearer token injection from Supabase session
- deduplicated token refresh on 401
- request timeout and typed network errors
- envelope and paginated response parsing

## Role-Based UI

- Employee navigation: dashboard, sessions, expenses, profile, leaderboard
- Admin navigation: dashboard, tracking/map, sessions, employees, analytics, expenses, monitoring, queues, retry intents, webhooks, API keys, system health

## API Contract Usage

The frontend calls API endpoints from `src/lib/api/endpoints.ts` and domain modules in `src/lib/api/*`.

Contract-level details are documented in `API_USAGE.md`.

## Additional Docs

- `UI_ARCHITECTURE.md`
- `API_USAGE.md`
