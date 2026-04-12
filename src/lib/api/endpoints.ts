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
  receiptUploadUrl: "/expenses/receipt-upload-url",

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
  testWebhook: (id: string) => `/admin/webhooks/${id}/test`,
  webhookLogs: "/admin/webhooks/logs",
  retryWebhookLog: (id: string) => `/admin/webhooks/logs/${id}/retry`,
  webhookDeliveries: "/admin/webhook-deliveries",
  retryDelivery: (id: string) => `/admin/webhook-deliveries/${id}/retry`,

  // Exports
  expensesExport: "/admin/expenses/export",

  // Admin operations
  forceCheckout: "/admin/force-checkout",
  systemHealth: "/admin/system-health",
  retryIntents: "/admin/retry-intents",
  apiKeys: "/admin/api-keys",
  apiKeyById: (id: string) => `/admin/api-keys/${id}`,

  // Other
  auditLogs: "/admin/audit-log",
} as const;
