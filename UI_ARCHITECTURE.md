# FieldTrack Web UI Architecture

This document describes implemented frontend architecture and UI data flow.

Source audit: 2026-11-24. Local build success validates compilation/static pages,
not live authenticated flows, continuous browser tracking or complete test coverage.

## Application Structure

Top-level frontend layers:

- Routing and layouts: `src/app`
- Shared visual system: `src/app/globals.css`, `tailwind.config.ts`, `src/components`
- Auth/session state: `src/contexts/AuthContext.tsx`
- Data access: `src/lib/api/*`
- Server-state orchestration: `src/hooks/queries/*` and `src/lib/query-client.ts`

## Design System

Implemented design primitives:

- CSS custom properties for semantic tokens in `globals.css`
  - background/surface tiers
  - semantic colors (`primary`, `secondary`, `error`, etc.)
  - chart/map-specific color variables
- Tailwind maps these tokens through `tailwind.config.ts`
- shared utility/component classes (cards, buttons, surfaces, state styling)
- font strategy:
  - `Plus Jakarta Sans` is loaded for both body and display in `src/app/layout.tsx`
  - legacy CSS variable names remain `--font-public-sans` and `--font-lexend`

UI supports both light and dark themes through class-based theming.

## Component and Layout Model

- auth routes under `src/app/(auth)`
- authenticated shell under `src/app/(protected)`
- role-aware sidebars in protected layout
- client role resolution can fall back to app metadata and, in AuthContext/login,
  user metadata; middleware/API do not use the same fallback. These are UI
  decisions, not trusted backend authorization.
- admin-only enhancements:
  - snapshot health banner
  - SSE-driven cache refresh via `useAdminSSE`

## Data Fetching Patterns

Data layer conventions:

- each domain has API module(s) in `src/lib/api`
- React Query hooks live in `src/hooks/queries`
- query keys are centralized per domain (for stable invalidation)
- paginated reads use `apiGetPaginated`
- non-paginated envelope reads use `apiGet` / `apiGetEnvelope`

Global query behavior:

- default stale time 60 seconds
- `refetchOnWindowFocus` disabled globally
- retry strategy avoids repeated auth retries
- queries avoid retries for 401/403; global mutations still retry once by default

Per-hook customization examples in code:

- shorter stale time for rapidly changing session/expense lists
- `refetchInterval` on selected admin views
- `placeholderData: keepPreviousData` for paginated transitions
- conditional `enabled` queries for dependent fetches

## Pagination Strategy

Pagination pattern in list screens and hooks:

- request params: `page`, `limit`, plus domain filters (for example `status`)
- backend pagination metadata is consumed from `pagination` object
- hooks preserve previous page while fetching next page
- UI-level navigation updates page state and reuses stable query keys

Known implemented constraints:

- some aggregate/status-bucket views intentionally fetch fixed windows and merge client-side for UX speed
- status buckets fetch only 100 rows each; employee history/session fallback
  lookups also use fixed pages, so older/larger datasets can be omitted
- the auth provider cancels and clears cached requests when the login identity changes

## Camera, preset sites and earnings

`CameraAttendance` captures the live camera after a fresh GPS fix, appends a
GPS/accuracy/IST-time footer and writes GPS EXIF into the JPEG. It uploads directly
to the signed private-storage URL and submits the matching attendance body.
Camera tracks stop on unmount. Browser GPS runs in the protected layout for a
shift started in that tab. Android supports background tracking on the device.
Employees confirm arrival at a preset site by submitting a fresh GPS fix to the API.

`/admin/field` contains confirmed INR / IST setup, full site-definition editing,
visit rates/radii, employee salary history and reports/CSV export for daily,
weekly, monthly and custom periods. `/employee/earnings` uses the employee-only
report endpoint. Admin reports poll every 30 seconds. The admin payment panel
shows outstanding pay and saved payments for the selected employee.

## Live Updates (SSE)

Admin live-update code is designed for server-sent events:

- hook: `src/hooks/useAdminSSE.ts`
- endpoint: `/admin/events`
- event types handled:
  - `session.checkin`
  - `session.checkout`
  - `expense.created`
  - `expense.status`

Behavior:

- targeted invalidation of sessions/dashboard/map/expense queries
- bearer authentication and reconnection with exponential backoff
- connection active only for authenticated admins

The Next.js proxy streams events. Backend events are process-local. Live maps
poll the database-backed endpoint every 10 seconds to show latest GPS regardless
of which API replica receives the update.

## Error and Mutation Handling

Mutation strategy:

- update the active shift after a successful attendance write
- roll back optimistic expense reviews on failure
- post-settle invalidation for consistency

Global error strategy:

- query/mutation cache emits standardized UI error event
- toaster maps error codes (validation, forbidden, network, timeout)
- request id surfaced when available

Verification commands include `npm run build`, `npm run lint`, `npm run type-check`,
`npm run test:selfie`, and `npm run test:proxy`. The selfie helper suite mocks
canvas and the proxy test exercises streaming and disconnects over local HTTP.
