# FieldTrack Web API Usage

This document maps frontend API usage to implemented backend contracts.

Last source audit: 2026-11-24. Endpoint paths in domain modules are authoritative
where new field/camera routes are not included in the central `API` constants.

## API Client Layer

Primary files:

- endpoint constants: `src/lib/api/endpoints.ts`
- transport/auth/error handling: `src/lib/api/client.ts`
- domain modules: `src/lib/api/*.ts`

Client behavior:

- injects bearer token from Supabase session
- retries once after coordinated token refresh on 401
- converts network/timeout failures into typed `ApiError`
- GET transport retries are limited. Payment writes can retry once with the same request ID after a transient failure.
- parses standard envelope and paginated contract shapes

## Endpoint Usage by Domain

### Auth

- `GET /auth/me` via `authApi.me()`

### Attendance and Sessions

- `POST /attendance/check-in`
- `POST /attendance/selfie-challenge`
- `GET /attendance/:sessionId/selfie`
- `POST /attendance/check-out`
- `POST /attendance/:sessionId/recalculate`
- `GET /attendance/my-sessions`
- `GET /admin/sessions`
- `GET /admin/sessions/:id/locations`

Session filters sent by frontend:

- `status=all|active|recent|inactive`
- optional `employee_id` for admin employee history scopes

Camera flow: `getUserMedia` (no file/gallery picker), fresh GPS, visible image
footer and GPS EXIF, signed JPEG PUT, then `attendanceApi.checkIn(body)` with
`challenge_id`, coordinates/accuracy, `captured_at`, `location_at`. The API
rejects absent/mismatched EXIF. Times are ISO UTC in JSON, displayed/stamped in
IST (UTC+05:30). Signed uploads omit API bearer credentials. Check-out has no body.

### Locations

- `GET /locations/my-route?sessionId=<uuid>`
- `POST /locations` sends on-duty GPS from a browser-started shift
- `GET /admin/monitoring/map` and optional `employeeId` retrieve active shift GPS for the organization or one employee

Browser tracking runs during the shift in the tab that checked in, including
across navigation within the site. It depends on browser location permission,
network connectivity, and the browser's ability to schedule time and location reads.

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

### Field locations and pay

`src/lib/api/field-operations.ts` calls:

- `GET /field/settings`, `GET /field/sites`
- `POST /field/sites/:id/reach` submits a fresh fix and returns verified arrival and visit pay eligibility
- `POST /admin/field/settings` (confirmed INR / `Asia/Kolkata` setup)
- `POST /admin/field/sites`, `PATCH /admin/field/sites/:id` (full body, not partial)
- `GET /admin/field/basic-pay`, `POST /admin/field/basic-pay/:employeeId`
- `GET /admin/field/reports`, `GET /field/my-report`
- `GET /admin/field/reports/export` (JSON `{filename,csv}`; downloaded by the UI)
- `GET /admin/field/payments/:employeeId/preview` returns outstanding pay for the selection
- `GET /admin/field/payments/:employeeId` returns saved payment history
- `POST /admin/field/payments/:employeeId` records paid visit pay, monthly basic pay, or both with the expected total and request ID

Reports accept `period=day|week|month&date=YYYY-MM-DD` or an inclusive
`period=range&from=YYYY-MM-DD&to=YYYY-MM-DD` and optional admin `employee_id`.
Returned periods have exclusive end dates in the company timezone. Money uses
integer minor units. The report combines eligible visits and basic pay for each
fully included calendar month. A missing required salary leaves the calculated
total unset. Payment preview subtracts previously recorded visits and salary months.

## Query Keys and Caching Strategy

Query keys are domain-based and include dynamic filters to avoid stale collisions.

Authentication changes cancel and clear cached requests and remount protected
views when the user, organization, employee association or role changes.

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

- active-shift updates after successful check-in and check-out
- optimistic expense review with rollback on error
- invalidate affected domains on settle (for example sessions + dashboard + employees)

`useAdminSSE` invalidates queries when session or expense events arrive. It
opens the stream with bearer-header authentication and reconnects with backoff.
The Next.js proxy streams `/admin/events` as it arrives and buffers regular API
responses within its request timeout. The live map polls the API for GPS positions.
