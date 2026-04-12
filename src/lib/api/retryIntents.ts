import { apiGetPaginated } from "@/lib/api/client";
import { API } from "@/lib/api/endpoints";

export interface RetryIntent {
  id: string;
  queue_name: string;
  job_key: string;
  payload: Record<string, unknown>;
  status: "pending" | "failed" | "dead";
  retry_count: number;
  error_message: string | null;
  next_retry_at: string | null;
  created_at: string;
  updated_at: string;
}

export type RetryIntentStatus = "pending" | "failed" | "dead" | "all";

export const retryIntentsApi = {
  list: (status: RetryIntentStatus = "pending", page = 1, limit = 50) =>
    apiGetPaginated<RetryIntent>(API.retryIntents, {
      status,
      page: String(page),
      limit: String(limit),
    }),
};
