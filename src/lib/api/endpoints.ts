/**
 * Centralised API endpoint paths.
 * All query hooks should import from here instead of hard-coding URLs.
 */
export const API = {
  // Sessions
  sessions: "/attendance/my-sessions",
  adminSessions: "/admin/sessions",

  // Locations
  route: "/locations/my-route",
  sessionLocations: (id: string) => `/admin/sessions/${id}/locations`,

  // Expenses
  expenses: "/expenses/my",
  orgExpenses: "/admin/expenses",
  expenseStatus: (id: string) => `/admin/expenses/${id}`,
  createExpense: "/expenses",
  expensesSummary: "/admin/expenses/summary",
  // Note: /admin/expenses/export is intentionally excluded from the standalone frontend
  // contract — no active caller remains in source flows.

  // Analytics
  orgSummary: "/admin/org-summary",
  topPerformers: "/admin/top-performers",
  adminLeaderboard: "/admin/leaderboard",
  sessionTrend: "/admin/session-trend",
  leaderboard: "/leaderboard",

  // Dashboards
  myDashboard: "/dashboard/my-summary",
  adminDashboard: "/admin/dashboard",

  // Monitoring
  startMonitoring: "/admin/start-monitoring",
  stopMonitoring: "/admin/stop-monitoring",
  monitoringHistory: "/admin/monitoring-history",
  adminMap: "/admin/monitoring/map",
  adminEvents: "/admin/events",
  adminQueues: "/admin/queues",

  // Employees
  createEmployee: "/admin/employees",
  listEmployees: "/admin/employees",
  getEmployee: (id: string) => `/admin/employees/${id}`,
  updateEmployee: (id: string) => `/admin/employees/${id}`,
  setEmployeeStatus: (id: string) => `/admin/employees/${id}/status`,
  employeeProfile: (id: string) => `/admin/employees/${id}/profile`,

  // Search
  search: "/admin/search",

  // Profile
  myProfile: "/profile/me",

  // Auth identity (future endpoint — returns { id, email, role, orgId } from JWT)
  authMe: "/auth/me",

  // Webhooks
  webhooks: "/admin/webhooks",
  webhookById: (id: string) => `/admin/webhooks/${id}`,
  webhookDeliveries: "/admin/webhook-deliveries",
  retryDelivery: (id: string) => `/admin/webhook-deliveries/${id}/retry`,

  // Other
  auditLogs: "/admin/audit-logs",
  forceCheckout: "/admin/force-checkout",
} as const;
