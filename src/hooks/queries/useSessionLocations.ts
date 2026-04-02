"use client";

import { useQuery } from "@tanstack/react-query";
import { sessionLocationsApi } from "@/lib/api/sessionLocations";

export function useSessionLocations(sessionId: string | null) {
  return useQuery({
    queryKey: ["session-locations", sessionId],
    enabled: sessionId !== null,
    queryFn: () => sessionLocationsApi.bySessionId(sessionId!),
  });
}
