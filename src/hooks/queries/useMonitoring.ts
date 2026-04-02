"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { monitoringApi } from "@/lib/api/monitoring";

export function useMonitoringHistory(page: number, limit: number) {
  return useQuery({
    queryKey: ["monitoringHistory", page, limit],
    queryFn: () => monitoringApi.history(page, limit),
  });
}

export function useStartMonitoring() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => monitoringApi.start(),
    onSuccess: () => void client.invalidateQueries({ queryKey: ["monitoringHistory"] }),
  });
}

export function useStopMonitoring() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => monitoringApi.stop(),
    onSuccess: () => void client.invalidateQueries({ queryKey: ["monitoringHistory"] }),
  });
}
