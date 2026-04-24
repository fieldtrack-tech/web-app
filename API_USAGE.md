# FieldTrack Web API Usage

The web app consumes the backend contract without aliases.

| Domain | Hook/API | Endpoint | Param | Values |
|---|---|---|---|---|
| employee sessions | `useMySessions` | `/attendance/my-sessions` | `status` | `all`, `active`, `recent`, `inactive` |
| admin sessions | `useOrgSessions` | `/admin/sessions` | `status` | `all`, `active`, `recent`, `inactive` |
| employee expenses | `useMyExpenses` | `/expenses/my` | `status` | `all`, `PENDING`, `APPROVED`, `REJECTED`, `processed` |
| admin expenses | `expensesApi.adminExpenses` | `/admin/expenses` | `status` | `all`, `PENDING`, `APPROVED`, `REJECTED`, `processed` |

## Rules

- Use `status`, never `segment`.
- Session request values are lowercase.
- Expense enum values stay uppercase, except `all` and `processed`.
- Include filters in React Query keys.
- Use backend filtering instead of filtering result sets in the UI for contract filters.
