"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSessionLocations } from "@/hooks/queries/useSessionLocations";
import { ErrorBanner } from "@/components/ErrorBanner";
import { LoadingState } from "@/components/ui";
import { formatDate } from "@/lib/utils";

function coord(n: number) {
  return n.toFixed(6);
}

export default function SessionLocationsPage() {
  const { permissions } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const sessionId = params.id ?? null;

  const { data: locations, isLoading, error } = useSessionLocations(sessionId);

  if (!permissions.viewAnalytics) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button className="btn-secondary h-8 px-3 text-xs" onClick={() => router.back()}>
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <div>
          <h2 className="font-manrope text-3xl font-bold text-on-surface">Session Route</h2>
          <p className="text-xs font-mono text-on-surface-variant truncate max-w-xs">{sessionId}</p>
        </div>
      </div>

      {error ? <ErrorBanner error={error} /> : null}
      {isLoading ? <LoadingState message="Loading route..." /> : null}

      {!isLoading ? (
        <div className="card overflow-x-auto">
          <div className="flex items-center justify-between mb-2">
            <p className="font-manrope font-bold text-on-surface flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              GPS Points
            </p>
            <span className="badge-neutral">{locations?.length ?? 0} points</span>
          </div>
          {!locations?.length ? (
            <p className="text-sm text-on-surface-variant text-center py-8">No GPS points recorded for this session.</p>
          ) : (
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Recorded At</th>
                  <th>Latitude</th>
                  <th>Longitude</th>
                  <th>Accuracy (m)</th>
                </tr>
              </thead>
              <tbody>
                {locations.map((loc, idx) => (
                  <tr key={loc.id}>
                    <td>{loc.sequence_number ?? idx + 1}</td>
                    <td>{formatDate(loc.recorded_at)}</td>
                    <td className="font-mono">{coord(loc.latitude)}</td>
                    <td className="font-mono">{coord(loc.longitude)}</td>
                    <td className="font-mono">{loc.accuracy !== null ? loc.accuracy.toFixed(1) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : null}
    </div>
  );
}
