import { apiGet, apiGetPaginated, apiPatch, apiPost } from "@/lib/api/client";
import { API } from "@/lib/api/endpoints";
import type { AuditLog, AttendanceSession, Employee, EmployeeProfileDetail, SearchResults } from "@/types";

export const adminApi = {
  employees: (page = 1, limit = 50, params: { search?: string; segment?: string } = {}) =>
    apiGetPaginated<Employee>(API.listEmployees, {
      page: String(page),
      limit: String(limit),
      ...(params.search ? { search: params.search } : {}),
      ...(params.segment ? { segment: params.segment } : {}),
    }),

  employee: (id: string) => apiGet<Employee>(API.getEmployee(id)),

  employeeProfile: (id: string) => apiGet<EmployeeProfileDetail>(API.employeeProfile(id)),

  search: (q: string, limit = 10) =>
    apiGet<SearchResults>(API.search, {
      q,
      limit: String(limit),
    }),

  createEmployee: (payload: {
    name: string;
    employee_code?: string;
    user_id?: string;
    phone?: string;
  }) => apiPost<Employee>(API.createEmployee, payload),

  setEmployeeStatus: (id: string, is_active: boolean) =>
    apiPatch<Employee>(API.setEmployeeStatus(id), { is_active }),

  auditLogs: (limit = 50, before?: string) =>
    apiGet<AuditLog[]>(API.auditLogs, {
      limit: String(limit),
      ...(before ? { before } : {}),
    }),

  forceCheckout: (employeeId: string) =>
    apiPost<AttendanceSession>(API.forceCheckout, { employee_id: employeeId }),
};
