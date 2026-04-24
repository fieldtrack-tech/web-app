# FieldTrack Web UI Architecture

The web app is a Next.js App Router application with Supabase auth, React Query data loading, and API helpers under `src/lib/api`.

## Structure

- `src/app/(auth)`: login routes.
- `src/app/(protected)`: authenticated employee and admin pages.
- `src/components`: shared UI, admin tables, employee cards, maps, charts, and layout.
- `src/hooks/queries`: React Query hooks and cache keys.
- `src/lib/api`: endpoint constants and typed API functions.
- `src/types`: frontend API response types.

## Data Flow

Pages keep view state such as current page and filter. Query hooks include that state in their keys and pass it to the API layer. The API layer serializes contract query params and parses the backend envelope.

Session filters use lowercase `status`. Expense filters use uppercase enum values plus lowercase `all` and `processed`.
