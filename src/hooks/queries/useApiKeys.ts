"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiKeysApi } from "@/lib/api/api-keys";
import type { ApiKeyScope } from "@/types";

export const API_KEY_SCOPE_OPTIONS: ApiKeyScope[] = [
  "read:employees",
  "read:sessions",
  "write:expenses",
  "admin:all",
];

export function useApiKeys() {
  return useQuery({
    queryKey: ["api-keys"],
    queryFn: () => apiKeysApi.list(),
    staleTime: 15_000,
  });
}

export function useCreateApiKey() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; scopes: ApiKeyScope[] }) => apiKeysApi.create(payload),
    onSuccess: () => void client.invalidateQueries({ queryKey: ["api-keys"] }),
  });
}

export function useUpdateApiKey() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: string; name?: string; scopes?: ApiKeyScope[]; active?: boolean }) =>
      apiKeysApi.update(payload.id, { name: payload.name, scopes: payload.scopes, active: payload.active }),
    onSuccess: () => void client.invalidateQueries({ queryKey: ["api-keys"] }),
  });
}

export function useDeleteApiKey() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiKeysApi.remove(id),
    onSuccess: () => void client.invalidateQueries({ queryKey: ["api-keys"] }),
  });
}
