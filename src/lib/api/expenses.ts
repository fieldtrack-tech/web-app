import { apiGetPaginated, apiPatch, apiPost } from "@/lib/api/client";
import { API } from "@/lib/api/endpoints";
import type { EmployeeExpenseSummary, Expense, ExpenseStatus } from "@/types";

interface AdminExpenseParams {
  employeeId?: string;
  status?: string;
}

export const expensesApi = {
  submit: (payload: {
    amount: number;
    description: string;
    receipt_url?: string;
    extension?: string;
  }) => apiPost<Expense>(API.createExpense, payload),

  myExpenses: (page = 1, limit = 50) =>
    apiGetPaginated<Expense>(API.expenses, {
      page: String(page),
      limit: String(limit),
    }),

  adminExpenses: (page = 1, limit = 50, params: AdminExpenseParams = {}) =>
    apiGetPaginated<Expense>(API.orgExpenses, {
      page: String(page),
      limit: String(limit),
      ...(params.employeeId ? { employee_id: params.employeeId } : {}),
      ...(params.status ? { status: params.status } : {}),
    }),

  summaryByEmployee: (page = 1, limit = 50) =>
    apiGetPaginated<EmployeeExpenseSummary>(API.expensesSummary, {
      page: String(page),
      limit: String(limit),
    }),

  review: (id: string, status: Extract<ExpenseStatus, "APPROVED" | "REJECTED">) =>
    apiPatch<Expense>(API.expenseStatus(id), { status }),
};
