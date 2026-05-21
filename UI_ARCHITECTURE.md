# FieldTrack Web UI Architecture

This document describes implemented frontend architecture and UI data flow.

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
  - `Public Sans` for body
  - `Lexend` for headings

UI supports both light and dark themes through class-based theming.

## Component and Layout Model

- auth routes under `src/app/(auth)`
- authenticated shell under `src/app/(protected)`
- role-aware sidebars in protected layout
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

## Live Updates (SSE)

Admin live updates are implemented with server-sent events:

- hook: `src/hooks/useAdminSSE.ts`
- endpoint: `/admin/events`
- event types handled:
  - `session.checkin`
  - `session.checkout`
  - `expense.created`
  - `expense.status`

Behavior:

- optimistic cache patch for session events where payload supports it
- targeted invalidation of sessions/dashboard/map/expense queries
- reconnect with exponential backoff
- connection active only for authenticated admins

## Error and Mutation Handling

Mutation strategy:

- optimistic updates for selected session and expense workflows
- rollback to snapshot on mutation failure
- post-settle invalidation for consistency

Global error strategy:

- query/mutation cache emits standardized UI error event
- toaster maps error codes (validation, forbidden, network, timeout)
- request id surfaced when available
