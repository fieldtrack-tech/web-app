# FieldTrack Web API Usage

This document maps frontend API usage to implemented backend contracts.

## API Client Layer

Primary files:

- endpoint constants: `src/lib/api/endpoints.ts`
- transport/auth/error handling: `src/lib/api/client.ts`
- domain modules: `src/lib/api/*.ts`

Client behavior:

- injects bearer token from Supabase session
- retries once after coordinated token refresh on 401
- converts network/timeout failures into typed `ApiError`
- parses standard envelope and paginated contract shapes

## Endpoint Usage by Domain

### Auth

- `GET /auth/me` via `authApi.me()`

### Attendance and Sessions

- `POST /attendance/check-in`
- `POST /attendance/check-out`
- `POST /attendance/:sessionId/recalculate`
- `GET /attendance/my-sessions`
- `GET /admin/sessions`
- `GET /admin/sessions/:id/locations`

Session filters sent by frontend:

- `status=all|active|recent|inactive`
- optional `employee_id` for admin employee history scopes

### Locations

- `GET /locations/my-route?sessionId=<uuid>`

### Expenses

- `POST /expenses`
- `POST /expenses/receipt-upload-url`
- `GET /expenses/my`
- `GET /admin/expenses`
- `PATCH /admin/expenses/:id`
- `GET /admin/expenses/summary`
- `GET /admin/expenses/export`

Expense status values used:

- `all`
- `PENDING`
- `APPROVED`
- `REJECTED`
- `processed`

### Admin Core

- `GET /admin/employees`
- `POST /admin/employees`
- `GET /admin/employees/:id`
- `PATCH /admin/employees/:id/status`
- `GET /admin/search`
- `GET /admin/audit-log`
- `POST /admin/force-checkout`

### Analytics and Dashboards

- `GET /dashboard/my-summary`
- `GET /admin/dashboard`
- `GET /admin/monitoring/map`
- `GET /admin/org-summary`
- `GET /admin/user-summary`
- `GET /admin/top-performers`
- `GET /admin/session-trend`
- `GET /admin/leaderboard`
- `GET /leaderboard`

Date filtering follows backend contract (`from`, `to`) and optional metric/limit params where applicable.

### Monitoring and Operations

- `POST /admin/start-monitoring`
- `POST /admin/stop-monitoring`
- `GET /admin/monitoring-history`
- `GET /admin/queues`
- `GET /admin/retry-intents`
- `GET /admin/system-health`

### Webhooks and API Keys

- webhooks:
  - `GET /admin/webhooks`
  - `POST /admin/webhooks`
  - `PATCH /admin/webhooks/:id`
  - `DELETE /admin/webhooks/:id`
  - `GET /admin/webhooks/logs`
  - `POST /admin/webhooks/logs/:id/retry`
  - `POST /admin/webhooks/:id/test`
- api keys:
  - `GET /admin/api-keys`
  - `POST /admin/api-keys`
  - `PATCH /admin/api-keys/:id`
  - `DELETE /admin/api-keys/:id`

## Query Keys and Caching Strategy

Query keys are domain-based and include dynamic filters to avoid stale collisions.

Examples:

- sessions: `sessionKeys.mine(page, limit, status)`, `sessionKeys.org(...)`
- expenses: `expenseKeys.mine(page, limit, status)`, summary and employee-scoped keys
- dashboards/maps: `adminDashboard`, `adminMap`

Caching patterns:

- global stale time 60s, with hook-level overrides
- paginated hooks use `keepPreviousData`
- selected admin views use polling/refetch intervals

## Mutation and Invalidation

Mutation handling patterns:

- optimistic updates for check-in/check-out and expense review in query caches
- rollback on error using pre-mutation snapshots
- invalidate affected domains on settle (for example sessions + dashboard + employees)

SSE integration (`useAdminSSE`) complements mutations by invalidating or patching cache when server-side events arrive.
