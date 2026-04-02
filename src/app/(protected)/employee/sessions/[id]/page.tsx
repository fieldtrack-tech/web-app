"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useMySession } from "@/hooks/queries/useSessions";
import { useSessionRoute } from "@/hooks/queries/useLocations";
import { LoadingState, StatusBadge } from "@/components/ui";
import { ErrorBanner } from "@/components/ErrorBanner";
import { formatDate, formatDuration, formatKm } from "@/lib/utils";

const RouteMap = dynamic(
  () => import("@/components/maps/RouteMap").then((m) => m.RouteMap),
  { ssr: false, loading: () => <div className="h-64 rounded-xl bg-surface-container animate-pulse" /> }
);

export default function EmployeeSessionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: session, isLoading, error } = useMySession(id);
  const { data: route } = useSessionRoute(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/employee/sessions" className="btn-secondary h-8 px-3 text-xs">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Link>
        <div>
          <h2 className="font-manrope text-3xl font-bold text-on-surface">Session Detail</h2>
          <p className="text-xs text-on-surface-variant font-mono">{id}</p>
        </div>
      </div>

      {error ? <ErrorBanner error={error} /> : null}
      {isLoading ? <LoadingState /> : null}

      {!isLoading && session ? (
        <>
          <div className="card grid sm:grid-cols-4 gap-4">
            <div>
              <p className="section-heading">Check-in</p>
              <p className="text-sm text-on-surface">{formatDate(session.checkin_at)}</p>
            </div>
            <div>
              <p className="section-heading">Check-out</p>
              <p className="text-sm text-on-surface">{session.checkout_at ? formatDate(session.checkout_at) : "Live"}</p>
            </div>
            <div>
              <p className="section-heading">Duration</p>
              <p className="text-sm text-on-surface">{formatDuration(session.total_duration_seconds ?? 0)}</p>
            </div>
            <div>
              <p className="section-heading">Distance</p>
              <p className="text-sm text-on-surface">{formatKm(session.total_distance_km)}</p>
            </div>
            <div>
              <p className="section-heading">Status</p>
              <StatusBadge status={session.checkout_at ? "CLOSED" : "ACTIVE"} />
            </div>
          </div>

          <div className="card space-y-3">
            <p className="font-manrope font-bold text-on-surface">Route</p>
            {route?.length ? (
              <RouteMap points={route} className="h-64 rounded-xl overflow-hidden" />
            ) : (
              <p className="text-sm text-on-surface-variant py-8 text-center">No route points for this session.</p>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
