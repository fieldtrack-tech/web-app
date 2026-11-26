import { apiGet, apiPost } from "@/lib/api/client";
import { API } from "@/lib/api/endpoints";
import type { ArrivalFix } from "@/lib/api/field-operations";
import type { GpsLocation } from "@/types";

export const locationsApi = {
  record: (sessionId: string, fix: ArrivalFix) =>
    apiPost<GpsLocation>("/locations", { session_id: sessionId, ...fix }),
  myRoute: (sessionId: string) =>
    apiGet<GpsLocation[]>(API.route, { sessionId }),
};
