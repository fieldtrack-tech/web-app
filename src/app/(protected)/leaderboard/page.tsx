"use client";

import { useState } from "react";
import { Trophy } from "lucide-react";
import { useLeaderboard } from "@/hooks/queries/useAnalytics";
import { useMyProfile } from "@/hooks/queries/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { ErrorBanner } from "@/components/ErrorBanner";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { LeaderboardTable } from "@/components/charts/LeaderboardTable";
import type { TopPerformerMetric } from "@/types";

const METRICS: TopPerformerMetric[] = ["distance", "sessions", "duration", "expenses"];

export default function LeaderboardPage() {
  const [metric, setMetric] = useState<TopPerformerMetric>("distance");
  const debouncedMetric = useDebounce(metric, 300);
  const { data, isLoading, error, refetch } = useLeaderboard(debouncedMetric, 50);
  const { role } = useAuth();
  const { data: profile } = useMyProfile({ enabled: role !== "ADMIN" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-manrope text-3xl font-bold text-on-surface flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" />
          Leaderboard
        </h1>
        <p className="text-sm text-on-surface-variant">Rankings across your organisation.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {METRICS.map((m) => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            className={`btn-secondary h-8 px-3 text-xs capitalize ${metric === m ? "bg-primary/20 text-primary" : ""}`}
          >
            {m}
          </button>
        ))}
      </div>

      {error ? <ErrorBanner error={error} onRetry={() => void refetch()} /> : null}
      {isLoading ? (
        <LoadingSkeleton variant="table" />
      ) : (
        <LeaderboardTable
          data={data ?? []}
          metric={debouncedMetric}
          highlightEmployeeId={profile?.id}
          isAdmin={role === "ADMIN"}
        />
      )}
    </div>
  );
}
