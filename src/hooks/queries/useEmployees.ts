import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";

export const employeeKeys = {
  all: ["employees"] as const,
  list: (page: number, limit: number) => ["employees", "list", page, limit] as const,
  detail: (id: string) => ["employees", "detail", id] as const,
  auditLogs: (page: number, limit: number) => ["audit-logs", page, limit] as const,
};

export function useEmployees(page = 1, limit = 20) {
  return useQuery({
    queryKey: employeeKeys.list(page, limit),
    queryFn: () => adminApi.employees(page, limit),
    staleTime: 30_000,
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

export function useAuditLogs(page = 1, limit = 20) {
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
