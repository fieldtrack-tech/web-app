"use client";

import { useMySessions } from "@/hooks/queries/useSessions";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { CheckInCard } from "@/components/employee/CheckInCard";
import { SessionList } from "@/components/employee/SessionList";
import { LoadingState } from "@/components/ui";
import { useSessionRoute } from "@/hooks/queries/useLocations";
import dynamic from "next/dynamic";
import { formatKm, formatDuration } from "@/lib/utils";

const RouteMap = dynamic(
  () => import("@/components/maps/RouteMap").then((m) => m.RouteMap),
  { ssr: false, loading: () => <div className="card h-56 animate-pulse" /> }
);

function ActiveRouteSection({ sessionId }: { sessionId: string }) {
  const { data: route } = useSessionRoute(sessionId);
  if (!route?.length) return null;
  return (
    <div className="card space-y-3">
      <p className="font-manrope font-bold text-on-surface">Current Route</p>
      <RouteMap points={route} className="h-56 rounded-xl overflow-hidden" />
    </div>
  );
}

export default function EmployeeHomePage() {
  const { user, profile, isProfileLoading: loadProfile } = useCurrentUser();
  const { data: sessions, isLoading: loadSess } = useMySessions(1, 1);

  const activeSession = (sessions?.data ?? []).find((s) => !s.checkout_at) ?? null;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <p className="text-on-surface-variant text-sm">{greeting()},</p>
        <h1 className="font-manrope font-bold text-2xl text-on-surface">
          {user?.user_metadata?.name ?? user?.user_metadata?.full_name ?? (user?.email ? user.email.split("@")[0] : "Field Agent")}
        </h1>
      </div>

      {/* Stats strip */}
      {!loadProfile && profile && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Sessions",  value: String(profile.stats.totalSessions) },
            { label: "Distance",  value: formatKm(profile.stats.totalDistanceKm) },
            { label: "Hours",     value: formatDuration(profile.stats.totalDurationSeconds) },
          ].map((s) => (
            <div key={s.label} className="card text-center space-y-0.5">
              <p className="section-heading">{s.label}</p>
              <p className="font-manrope font-bold text-xl text-on-surface">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Check-in card */}
      {loadSess ? <LoadingState /> : <CheckInCard activeSession={activeSession} />}

      {/* Route map for active session */}
      {activeSession && <ActiveRouteSection sessionId={activeSession.id} />}

      {/* Session history */}
      <SessionList />
    </div>
  );
}
