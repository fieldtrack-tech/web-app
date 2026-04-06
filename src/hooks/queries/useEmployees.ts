import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";
import type { EmployeeProfileDetail, SearchResults } from "@/types";

export const employeeKeys = {
  all: ["employees"] as const,
  list: (page: number, limit: number, search?: string, segment?: string) =>
    ["employees", "list", page, limit, search, segment] as const,
  detail: (id: string) => ["employees", "detail", id] as const,
  profile: (id: string) => ["employees", "profile", id] as const,
  search: (q: string) => ["search", q] as const,
  auditLogs: (page: number, limit: number) => ["audit-logs", page, limit] as const,
};

export function useEmployees(page = 1, limit = 50, search?: string, segment?: string) {
  return useQuery({
    queryKey: employeeKeys.list(page, limit, search, segment),
    queryFn: () => adminApi.employees(page, limit, { search, segment }),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useEmployee(id: string | null) {
  return useQuery({
    enabled: !!id,
    queryKey: employeeKeys.detail(id!),
    queryFn: () => adminApi.employee(id!),
    staleTime: 30_000,
  });
}

export function useEmployeeProfile(id: string | null) {
  return useQuery<EmployeeProfileDetail>({
    enabled: !!id,
    queryKey: employeeKeys.profile(id!),
    queryFn: () => adminApi.employeeProfile(id!),
    staleTime: 30_000,
  });
}

export function useSearch(q: string) {
  return useQuery<SearchResults>({
    enabled: q.length > 0,
    queryKey: employeeKeys.search(q),
    queryFn: () => adminApi.search(q),
    staleTime: 10_000,
  });
}

export function useAuditLogs(page = 1, limit = 50) {
  return useQuery({
    queryKey: employeeKeys.auditLogs(page, limit),
    queryFn: () => adminApi.auditLogs(page, limit),
    staleTime: 15_000,
  });
}

export function useCreateEmployee() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      name: string;
      employee_code?: string;
      user_id?: string;
      phone?: string;
    }) => adminApi.createEmployee(payload),
    onSuccess: () => void client.invalidateQueries({ queryKey: employeeKeys.all }),
  });
}

export function useSetEmployeeStatus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      adminApi.setEmployeeStatus(id, is_active),
    onSuccess: () => void client.invalidateQueries({ queryKey: employeeKeys.all }),
  });
}
