"use client";

import { useMyProfile } from "@/hooks/queries/useProfile";
import { useLeaderboard } from "@/hooks/queries/useAnalytics";
import { useAuth } from "@/hooks/useAuth";
import { ErrorBanner } from "@/components/ErrorBanner";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ProfileView } from "@/components/ProfileView";
import { PageTransition } from "@/components/motion";

export default function MyProfilePage() {
  const { user, role } = useAuth();
  const { data: profile, isLoading, error } = useMyProfile();
  const { data: leaderboard } = useLeaderboard("distance", 50);

  const myRank = profile && leaderboard
    ? leaderboard.find((e) => e.employeeId === profile.id)?.rank
    : undefined;

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h2 className="font-manrope text-3xl font-bold text-on-surface">My Profile</h2>
          <p className="text-sm text-on-surface-variant">Identity, activity status, and performance metrics.</p>
        </div>

        {isLoading ? (
          <LoadingSkeleton variant="card" className="h-64" />
        ) : error ? (
          role === "ADMIN" ? (
            <div className="card text-center py-10 space-y-2">
              <p className="font-manrope font-bold text-xl text-on-surface">{user?.email?.split("@")[0] ?? "Admin"}</p>
              <p className="text-sm text-on-surface-variant">Administrator accounts do not have employee field profiles.</p>
            </div>
          ) : (
            <ErrorBanner error={error} />
          )
        ) : profile ? (
          <ProfileView profile={profile} rank={myRank} />
        ) : null}
      </div>
    </PageTransition>
  );
}
