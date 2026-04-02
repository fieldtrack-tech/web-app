"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { webhooksApi } from "@/lib/api/webhooks";
import { WEBHOOK_EVENT_TYPES } from "@/types";
import type { DeliveryStatus, WebhookEventType } from "@/types";

export { WEBHOOK_EVENT_TYPES };

export interface CreateWebhookBody {
  url: string;
  events: WebhookEventType[];
  secret: string;
}

export interface UpdateWebhookBody {
  url?: string;
  events?: WebhookEventType[];
  is_active?: boolean;
  secret?: string;
}

export function useWebhooks() {
  return useQuery({
    queryKey: ["webhooks"],
    queryFn: () => webhooksApi.list(),
    staleTime: 30_000,
  });
}

export function useWebhookDeliveries(
  page: number,
  limit: number,
  webhookId?: string,
  status?: DeliveryStatus
) {
  return useQuery({
    queryKey: ["webhookDeliveries", page, limit, webhookId, status],
    queryFn: () => webhooksApi.deliveries(page, limit, webhookId, status),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });
}

export function useCreateWebhook() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateWebhookBody) => webhooksApi.create(body),
    onSuccess: () => void client.invalidateQueries({ queryKey: ["webhooks"] }),
  });
}

export function useUpdateWebhook(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateWebhookBody) => webhooksApi.update(id, body),
    onSuccess: () => void client.invalidateQueries({ queryKey: ["webhooks"] }),
  });
}

export function useDeleteWebhook() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => webhooksApi.remove(id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["webhooks"] });
      void client.invalidateQueries({ queryKey: ["webhookDeliveries"] });
    },
  });
}

export function useRetryDelivery() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (deliveryId: string) => webhooksApi.retryDelivery(deliveryId),
    onSuccess: () => void client.invalidateQueries({ queryKey: ["webhookDeliveries"] }),
  });
}
