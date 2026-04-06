import { apiGet, apiGetPaginated, apiPatch, apiPost } from "@/lib/api/client";
import { API } from "@/lib/api/endpoints";
import type { AuditLog, Employee, EmployeeProfileDetail, SearchResults } from "@/types";

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

  auditLogs: (page = 1, limit = 50) =>
    apiGetPaginated<AuditLog>(API.auditLogs, {
      page: String(page),
      limit: String(limit),
    }),

  forceCheckout: (employeeId: string) =>
    apiPost<{ message: string }>(API.forceCheckout, {
      employee_id: employeeId,
    }),
};
