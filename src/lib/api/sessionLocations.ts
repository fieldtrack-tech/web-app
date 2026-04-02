import { apiGet } from "@/lib/api/client";
import { API } from "@/lib/api/endpoints";
import type { SessionLocation } from "@/types";

export const sessionLocationsApi = {
  bySessionId: async (sessionId: string) => {
    const res = await apiGet<{ success: true; data: SessionLocation[] }>(
      API.sessionLocations(sessionId)
    );
    return res.data ?? [];
  },
};
