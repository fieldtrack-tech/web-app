import { apiGet } from "@/lib/api/client";
import { API } from "@/lib/api/endpoints";
import type { SessionLocation } from "@/types";

export const sessionLocationsApi = {
  bySessionId: async (sessionId: string) => {
    return apiGet<SessionLocation[]>(API.sessionLocations(sessionId));
  },
};
