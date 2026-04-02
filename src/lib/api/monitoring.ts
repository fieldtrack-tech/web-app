import { apiGet, apiGetPaginated, apiPost } from "@/lib/api/client";
import { API } from "@/lib/api/endpoints";
import type { AdminSession, EmployeeMapMarker } from "@/types";

export const monitoringApi = {
  history: (page = 1, limit = 20) =>
    apiGetPaginated<AdminSession>(API.monitoringHistory, {
      page: String(page),
      limit: String(limit),
    }),

  start: () => apiPost<AdminSession>(API.startMonitoring, {}),

  stop: () => apiPost<AdminSession>(API.stopMonitoring, {}),

  map: () => apiGet<EmployeeMapMarker[]>(API.adminMap),
};
