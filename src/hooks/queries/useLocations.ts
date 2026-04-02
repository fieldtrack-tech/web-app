import { useQuery } from "@tanstack/react-query";
import { locationsApi } from "@/lib/api/locations";

export const locationKeys = {
  route: (sessionId: string) => ["locations", "route", sessionId] as const,
};

export function useSessionRoute(sessionId: string | null) {
  return useQuery({
    enabled: !!sessionId,
    queryKey: locationKeys.route(sessionId!),
    queryFn: () => locationsApi.myRoute(sessionId!),
    staleTime: 15_000, // routes update frequently
  });
}
