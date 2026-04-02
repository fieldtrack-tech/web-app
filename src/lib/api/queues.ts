import { apiGetEnvelope } from "@/lib/api/client";
import { API } from "@/lib/api/endpoints";
import type { AdminQueuesResponse } from "@/types";

interface RawAdminQueuesResponse {
  success: true;
  queues: {
    analytics: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      dlq?: number | { waiting?: number; failed?: number };
    };
    distance: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      dlq?: number;
    };
  };
}

export const queuesApi = {
  adminQueues: async (): Promise<AdminQueuesResponse> => {
    const response = await apiGetEnvelope<RawAdminQueuesResponse>(API.adminQueues);
    const analyticsDlq = response.queues.analytics.dlq;
    return {
      ...response,
      queues: {
        ...response.queues,
        analytics: {
          ...response.queues.analytics,
          dlq:
            typeof analyticsDlq === "number"
              ? analyticsDlq
              : (analyticsDlq?.waiting ?? 0) + (analyticsDlq?.failed ?? 0),
        },
      },
    };
  },
};
