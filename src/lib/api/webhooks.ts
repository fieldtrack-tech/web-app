import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from "@/lib/api/client";
import { API } from "@/lib/api/endpoints";
import type {
  DeliveryStatus,
  WebhookDelivery,
  WebhookEventType,
  WebhookRecord,
} from "@/types";

export const webhooksApi = {
  list: () => apiGet<WebhookRecord[]>(API.webhooks),

  deliveries: (page: number, limit: number, webhookId?: string, status?: DeliveryStatus) => {
    const params: Record<string, string> = {
      page: String(page),
      limit: String(limit),
    };
    if (webhookId) params.webhook_id = webhookId;
    if (status) params.status = status;
    return apiGetPaginated<WebhookDelivery>(API.webhookDeliveries, params);
  },

  create: (payload: { url: string; events: WebhookEventType[]; secret: string }) =>
    apiPost<WebhookRecord>(API.webhooks, payload),

  update: (
    id: string,
    payload: {
      url?: string;
      events?: WebhookEventType[];
      is_active?: boolean;
      secret?: string;
    }
  ) => apiPatch<WebhookRecord>(API.webhookById(id), payload),

  remove: (id: string) => apiDelete<void>(API.webhookById(id)),

  retryDelivery: (id: string) => apiPost<WebhookDelivery>(API.retryDelivery(id), {}),
};
