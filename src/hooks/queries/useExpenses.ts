import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";
import { expensesApi } from "@/lib/api/expenses";
import type { ExpenseStatus } from "@/types";

export const expenseKeys = {
  all: ["expenses"] as const,
  mine: (page: number, limit: number) => ["expenses", "mine", page, limit] as const,
  admin: (page: number, limit: number) => ["expenses", "admin", page, limit] as const,
  summary: (page: number, limit: number) => ["expenses", "summary", page, limit] as const,
  employee: (employeeId: string, page: number, limit: number) =>
    ["expenses", "employee", employeeId, page, limit] as const,
};

export function useMyExpenses(page = 1, limit = 50) {
  return useQuery({
    queryKey: expenseKeys.mine(page, limit),
    queryFn: () => expensesApi.myExpenses(page, limit),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useAdminExpenses(page = 1, limit = 50) {
  return useQuery({
    queryKey: expenseKeys.admin(page, limit),
    queryFn: () => expensesApi.adminExpenses(page, limit),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useExpenseSummaryByEmployee(page = 1, limit = 50) {
  return useQuery({
    queryKey: expenseKeys.summary(page, limit),
    queryFn: () => expensesApi.summaryByEmployee(page, limit),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useEmployeeOrgExpenses(employeeId: string | null, page = 1, limit = 50) {
  return useQuery({
    enabled: !!employeeId,
    queryKey: expenseKeys.employee(employeeId!, page, limit),
    queryFn: () =>
      expensesApi.adminExpenses(page, limit, {
        employeeId: employeeId!,
        status: "all",
      }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useAllAdminPendingExpenses() {
  const query = useInfiniteQuery({
    queryKey: ["expenses", "admin", "all-pending"],
    queryFn: ({ pageParam }: { pageParam: number }) => expensesApi.adminExpenses(pageParam, 50),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.reduce((sum, currentPage) => sum + currentPage.data.length, 0);
      return fetched < lastPage.pagination.total ? allPages.length + 1 : undefined;
    },
    select: (data) => data.pages.flatMap((page) => page.data),
    staleTime: 30_000,
  });

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useEmployeePendingExpenses(
  summary:
    | {
        employeeId: string;
        employeeName: string;
        employeeCode: string | null;
        pendingCount: number;
      }
    | null,
) {
  return useQuery({
    enabled: !!summary,
    queryKey: ["expenses", "employee-pending", summary?.employeeId, summary?.pendingCount],
    queryFn: async () => {
      if (!summary) return [];

      // Fetch PENDING expenses for this specific employee directly
      const result = await expensesApi.adminExpenses(1, 100, {
        employeeId: summary.employeeId,
        status: "PENDING",
      });

      return result.data;
    },
    staleTime: 30_000,
  });
}

export function useSubmitExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: expensesApi.submit,
    onSuccess: () => qc.invalidateQueries({ queryKey: expenseKeys.all }),
  });
}

export function useReviewExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: Extract<ExpenseStatus, "APPROVED" | "REJECTED">;
    }) => expensesApi.review(id, status),
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await qc.cancelQueries({ queryKey: expenseKeys.all });

      // Snapshot all expense queries for rollback
      const previousQueries = qc.getQueriesData({ queryKey: expenseKeys.all });

      // Optimistically update matching expense in all cached queries
      qc.setQueriesData(
        { queryKey: expenseKeys.all },
        (old: unknown) => {
          if (!old || typeof old !== "object") return old;
          const page = old as { data?: Array<{ id: string; status: string }> };
          if (!Array.isArray(page.data)) return old;
          return {
            ...page,
            data: page.data.map((e) =>
              e.id === id ? { ...e, status } : e
            ),
          };
        },
      );

      return { previousQueries };
    },
    onError: (_err, _vars, context) => {
      // Roll back on error
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          qc.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: expenseKeys.all });
      // Dashboard shows pending expense count — refresh after review
      void qc.invalidateQueries({ queryKey: ["adminDashboard"] });
    },
  });
}
