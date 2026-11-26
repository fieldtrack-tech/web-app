import { apiGetPaginated, apiPost } from "@/lib/api/client";
import { API } from "@/lib/api/endpoints";
import type { AttendanceSession } from "@/types";
import type { CameraCheckIn } from "./field-operations";

export const attendanceApi = {
  checkIn: (body: CameraCheckIn) => apiPost<AttendanceSession>("/attendance/check-in", body),

  checkOut: () => apiPost<AttendanceSession>("/attendance/check-out", {}),

  mySessions: (page = 1, limit = 50, status = "all", signal?: AbortSignal) =>
    apiGetPaginated<AttendanceSession>(API.sessions, {
      page: String(page),
      limit: String(limit),
      status,
    }, signal),

  orgSessions: (page = 1, limit = 50, status?: string) =>
    apiGetPaginated<AttendanceSession>(API.adminSessions, {
      page: String(page),
      limit: String(limit),
      ...(status && status !== "all" ? { status } : {}),
    }),

  allOrgSessions: () =>
    apiGetPaginated<AttendanceSession>(API.adminSessions, {
      page: "1",
      limit: "50",
    }),

  recalculate: (sessionId: string) =>
    apiPost<{ queued: boolean }>(
      `/attendance/${sessionId}/recalculate`
    ),

  employeeHistory: (employeeId: string) =>
    apiGetPaginated<AttendanceSession>(API.adminSessions, {
      employee_id: employeeId,
      page: "1",
      limit: "50",
    }),

  byIdFallback: async (id: string): Promise<AttendanceSession | undefined> => {
    const page = await apiGetPaginated<AttendanceSession>(API.sessions, {
      page: "1",
      limit: "50",
      status: "all",
    });
    return page.data.find((s) => s.id === id);
  },
};
