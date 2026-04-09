// ─── Auth ─────────────────────────────────────────────────────────────────
export type UserRole = "ADMIN" | "EMPLOYEE";
export type ExpenseStatus = "PENDING" | "APPROVED" | "REJECTED";
export type ActivityStatus = "ACTIVE" | "RECENT" | "INACTIVE";
export type DeliveryStatus = "pending" | "success" | "failed";

export interface JwtClaims {
  sub: string;
  organization_id: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface UserPermissions {
  viewSessions: boolean;
  viewLocations: boolean;
  viewExpenses: boolean;
  viewAnalytics: boolean;
  viewOrgSessions: boolean;
  viewOrgExpenses: boolean;
  manageExpenses: boolean;
}

// ─── API envelope ──────────────────────────────────────────────────────────

/** Semantic error codes — use these for type-safe error handling instead of comparing status numbers. */
export type ApiErrorCode =
  | "UNAUTHORIZED"      // 401 — token missing or expired and refresh failed
  | "FORBIDDEN"         // 403 — authenticated but role/permission denied
  | "NOT_FOUND"         // 404
  | "TIMEOUT"           // 408
  | "VALIDATION_ERROR"  // 400 — bad request / validation failure
  | "UNPROCESSABLE"     // 422 — semantic validation error
  | "INTERNAL_ERROR"    // 500
  | "UNAVAILABLE"       // 503
  | "NETWORK_ERROR"     // fetch/abort failure
  | "UNKNOWN";          // anything else

function codeFromStatus(status: number): ApiErrorCode {
  if (status === 400) return "VALIDATION_ERROR";
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 408) return "TIMEOUT";
  if (status === 422) return "UNPROCESSABLE";
  if (status === 500) return "INTERNAL_ERROR";
  if (status === 503) return "UNAVAILABLE";
  return "UNKNOWN";
}

export class ApiError extends Error {
  readonly code: ApiErrorCode;

  constructor(
    message: string,
    public readonly status: number,
    public readonly requestId?: string,
    code?: ApiErrorCode
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code ?? codeFromStatus(status);
  }
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  error: string;
  requestId?: string;
  details?: Array<{ path: string[]; message: string }>;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginatedParams {
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | null | undefined;
}

// ─── Attendance ───────────────────────────────────────────────────────────
export interface AttendanceSession {
  id: string;
  employee_id: string;
  organization_id: string;
  checkin_at: string;
  checkout_at: string | null;
  total_distance_km: number | null;
  total_duration_seconds: number | null;
  distance_recalculation_status: string | null;
  created_at: string;
  updated_at: string;
  employee_code?: string | null;
  employee_name?: string | null;
  activityStatus?: ActivityStatus;

  // Compatibility aliases from prior frontend implementation.
  checked_in_at?: string;
  checked_out_at?: string | null;
  status?: "ACTIVE" | "CLOSED";
}

export interface SessionDTO {
  id: string | null;
  employee_id: string;
  organization_id: string;
  checkin_at: string;
  checkout_at: string | null;
  total_distance_km: number | null;
  total_duration_seconds: number | null;
  distance_recalculation_status: string | null;
  created_at: string;
  updated_at: string;
  employee_code: string | null;
  employee_name: string | null;
  activityStatus: ActivityStatus;
}

// ─── Locations ────────────────────────────────────────────────────────────
export interface GpsLocation {
  id: string;
  session_id: string;
  employee_id: string;
  organization_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  recorded_at: string;
  sequence_number: number | null;
  is_duplicate?: boolean;
}

export type SessionLocation = GpsLocation;
export type LocationPoint = GpsLocation;

// ─── Expenses ─────────────────────────────────────────────────────────────
export interface Expense {
  id: string;
  employee_id: string;
  organization_id: string;
  amount: number;
  description: string;
  receipt_url: string | null;
  status: ExpenseStatus;
  rejection_comment: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
  employee_code?: string | null;
  employee_name?: string | null;
}

// ─── Employees / Audit ────────────────────────────────────────────────────
export interface Employee {
  id: string;
  organization_id: string;
  user_id?: string | null;
  email?: string | null;
  full_name?: string | null;
  role?: UserRole | null;
  created_at: string;
  updated_at?: string;
  last_seen_at?: string | null;

  // Compatibility aliases.
  name?: string | null;
  employee_code?: string | null;
  phone?: string | null;
  is_active?: boolean;
  is_checked_in?: boolean;
  last_check_in_at?: string | null;
  last_check_out_at?: string | null;
  last_location_at?: string | null;
  last_latitude?: number | null;
  last_longitude?: number | null;
  activity_status?: ActivityStatus;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  actor_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actor_name?: string | null;
}

// ─── Analytics ────────────────────────────────────────────────────────────
export interface OrgSummaryData {
  totalSessions: number;
  totalDistanceKm: number;
  totalDurationSeconds: number;
  totalExpenses: number;
  approvedExpenseAmount: number;
  rejectedExpenseAmount: number;
  activeEmployeesCount: number;
}

export type OrgSummary = OrgSummaryData;

export interface UserSummaryData {
  userId: string;
  totalSessions: number;
  totalDistanceKm: number;
  totalDurationSeconds: number;
  avgDistanceKmPerSession: number;
  avgDurationSecondsPerSession: number;
  totalExpenses: number;
  approvedExpenseAmount: number;
}

export type UserSummary = UserSummaryData;

export interface TopPerformerEntry {
  employeeId: string;
  employeeName: string;
  totalDistanceKm?: number;
  totalDurationSeconds?: number;
  totalSessions?: number;
  sessionsCount?: number;
}

export type TopPerformer = TopPerformerEntry;
export type TopPerformerMetric = "distance" | "duration" | "sessions" | "expenses";

export interface SessionTrendEntry {
  date: string;
  sessions: number;
  distance: number;
  duration: number;
}

export interface LeaderboardEntry {
  rank: number;
  employeeId: string;
  employeeCode: string | null;
  employeeName: string;
  distance: number;
  sessions: number;
  duration: number;
  expenses?: number;
}

// ─── Profile / dashboard / monitoring ─────────────────────────────────────
export interface EmployeeProfileData {
  id: string;
  name: string;
  employee_code: string | null;
  phone: string | null;
  is_active: boolean;
  activityStatus: ActivityStatus;
  last_activity_at: string | null;
  created_at: string;
  stats: {
    totalSessions: number;
    totalDistanceKm: number;
    totalDurationSeconds: number;
    expensesSubmitted: number;
    expensesApproved: number;
  };
}

export interface DashboardSummary {
  sessionsThisWeek: number;
  distanceThisWeek: number;
  hoursThisWeek: number;
  expensesSubmitted: number;
  expensesApproved: number;
}

export interface AdminDashboardData {
  activeEmployeeCount: number;
  recentEmployeeCount: number;
  inactiveEmployeeCount: number;
  activeEmployeesToday: number;
  todaySessionCount: number;
  todayDistanceKm: number;
  pendingExpenseCount: number;
  pendingExpenseAmount: number;
  sessionTrend: SessionTrendEntry[];
  leaderboard: LeaderboardEntry[];
  /**
   * ISO-8601 timestamp of the org_dashboard_snapshot's last update.
   * Display as "Last updated X seconds ago" to signal eventual consistency.
   */
  snapshotUpdatedAt: string | null;
}

export interface EmployeeMapMarker {
  employeeId: string;
  employeeName: string;
  employeeCode: string | null;
  status: ActivityStatus;
  sessionId: string | null;
  latitude: number;
  longitude: number;
  recordedAt: string;
}

export interface AdminSession {
  id: string;
  admin_id: string;
  organization_id: string;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  updated_at?: string;
}

export interface EmployeeExpenseSummary {
  employeeId: string;
  employeeName: string;
  employeeCode: string | null;
  pendingCount: number;
  pendingAmount: number;
  totalCount: number;
  totalAmount: number;
  latestExpenseDate: string | null;
}

// ─── Queues ───────────────────────────────────────────────────────────────
export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  dlq?: number;
}

export interface AdminQueuesResponse {
  success: true;
  queues: {
    analytics: QueueStats;
    distance: QueueStats;
  };
}

// ─── Webhooks ─────────────────────────────────────────────────────────────
export const WEBHOOK_EVENT_TYPES = [
  "employee.checked_in",
  "employee.checked_out",
  "expense.created",
  "expense.approved",
  "expense.rejected",
  "employee.created",
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

export interface WebhookRecord {
  id: string;
  organization_id: string;
  url: string;
  is_active: boolean;
  events: WebhookEventType[];
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_id: string;
  organization_id: string;
  status: DeliveryStatus;
  attempt_count: number;
  response_status: number | null;
  response_body: string | null;
  last_attempt_at: string | null;
  next_retry_at: string | null;
  created_at: string;
}

// ─── Search ───────────────────────────────────────────────────────────────
export interface SearchResults {
  employees: Array<{ id: string; name: string; employee_code: string | null; is_active: boolean }>;
  expenses: Array<{ id: string; description: string; amount: number; status: string; employee_name: string | null }>;
}

// ─── Employee Profile (detailed) ──────────────────────────────────────────
export interface EmployeeProfileDetail {
  employee: Employee & { is_checked_in: boolean; last_check_in_at: string | null };
  summary: {
    totalSessions: number;
    totalDistanceKm: number;
    totalDurationSeconds: number;
    expensesSubmitted: number;
    expensesApproved: number;
  };
  recentSessions: Array<{
    id: string;
    checkin_at: string;
    checkout_at: string | null;
    total_distance_km: number | null;
    total_duration_seconds: number | null;
    distance_recalculation_status: string | null;
    created_at: string;
  }>;
  expenses: Array<{
    id: string;
    amount: number;
    description: string;
    status: string;
    submitted_at: string;
    reviewed_at: string | null;
  }>;
}

// ─── Navigation helpers ───────────────────────────────────────────────────
export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}
