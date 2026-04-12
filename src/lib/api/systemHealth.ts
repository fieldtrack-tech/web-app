import { apiGetEnvelope } from "@/lib/api/client";
import { API } from "@/lib/api/endpoints";

export interface SystemHealthData {
  success: true;
  timestamp: string;
  workers: {
    active: number;
    expected: number;
    healthy: boolean;
  };
  queues: {
    webhook: { backlog: number; dlq: number };
    analytics: { backlog: number };
    distance: { backlog: number };
  };
  webhooks: {
    successRatePct: number;
    failureCount: number;
    retryCount: number;
    totalDeliveries: number;
  };
}

export const systemHealthApi = {
  get: () => apiGetEnvelope<SystemHealthData>(API.systemHealth),
};
