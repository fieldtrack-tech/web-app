import { apiGetPaginated, apiPost } from "@/lib/api/client";
import { API } from "@/lib/api/endpoints";
import type { AttendanceSession } from "@/types";

export const attendanceApi = {
  checkIn: () => apiPost<AttendanceSession>("/attendance/check-in", {}),

  checkOut: () => apiPost<AttendanceSession>("/attendance/check-out", {}),

  mySessions: (page = 1, limit = 50) =>
    apiGetPaginated<AttendanceSession>(API.sessions, {
      page: String(page),
      limit: String(limit),
    }),

  orgSessions: (page = 1, limit = 50, status?: string) =>
    apiGetPaginated<AttendanceSession>(API.adminSessions, {
      page: String(page),
      limit: String(limit),
      ...(status && status !== "all" ? { status } : {}),
    }),

  allOrgSessions: () =>
    apiGetPaginated<AttendanceSession>(API.adminSessions, {
      page: "1",
      limit: "100",
    }),

  recalculate: (sessionId: string) =>
    apiPost<{ queued: boolean }>(
      `/attendance/${sessionId}/recalculate`
    ),

  employeeHistory: (employeeId: string) =>
    apiGetPaginated<AttendanceSession>(API.adminSessions, {
      employee_id: employeeId,
      page: "1",
      limit: "100",
    }),

  byIdFallback: async (id: string): Promise<AttendanceSession | undefined> => {
    const page = await apiGetPaginated<AttendanceSession>(API.sessions, {
      page: "1",
      limit: "100",
    });
    return page.data.find((s) => s.id === id);
  },
};
