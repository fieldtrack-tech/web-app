import { apiGet } from "@/lib/api/client";
import { API } from "@/lib/api/endpoints";
import type { GpsLocation } from "@/types";

export const locationsApi = {
  myRoute: (sessionId: string) =>
    apiGet<GpsLocation[]>(API.route, { sessionId }),
};
