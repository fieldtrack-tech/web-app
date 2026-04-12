import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { API } from "@/lib/api/endpoints";
import type { ApiKeyRecord, ApiKeyScope, CreatedApiKey } from "@/types";

export const apiKeysApi = {
  list: () => apiGet<ApiKeyRecord[]>(API.apiKeys),

  create: (payload: { name: string; scopes: ApiKeyScope[] }) =>
    apiPost<CreatedApiKey>(API.apiKeys, payload),

  update: (id: string, payload: { name?: string; scopes?: ApiKeyScope[]; active?: boolean }) =>
    apiPatch<ApiKeyRecord>(API.apiKeyById(id), payload),

  remove: (id: string) => apiDelete<void>(API.apiKeyById(id)),
};
