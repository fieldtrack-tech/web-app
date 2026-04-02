"use client";

import { useQuery } from "@tanstack/react-query";
import { queuesApi } from "@/lib/api/queues";

export function useAdminQueues() {
  return useQuery({
    queryKey: ["admin", "queues"],
    queryFn: () => queuesApi.adminQueues(),
    refetchInterval: 30_000,
  });
}
