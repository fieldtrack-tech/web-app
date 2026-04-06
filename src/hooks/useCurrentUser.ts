"use client";

import { useAuth } from "@/hooks/useAuth";
import { useMyProfile } from "@/hooks/queries/useProfile";
import { isAdmin, isFieldRole } from "@/lib/auth/role";
import type { EmployeeProfileData } from "@/types";

export interface CurrentUser {
  // ─── Auth state (always available) ──────────────────────────────────────
  user: ReturnType<typeof useAuth>["user"];
  session: ReturnType<typeof useAuth>["session"];
  role: ReturnType<typeof useAuth>["role"];
  permissions: ReturnType<typeof useAuth>["permissions"];
  isLoading: boolean;

  // ─── Auth shortcuts ───────────────────────────────────────────────────────
  /** False while auth is still resolving. Callers can gate rendering on this. */
  isAuthenticated: boolean;

  // ─── Role helpers ────────────────────────────────────────────────────────
  isAdmin: boolean;
  /** True for EMPLOYEE, SUPERVISOR, FINANCE, TEAM_LEAD — any non-admin field role. */
  isFieldRole: boolean;
  /** Alias for isFieldRole for callers coming from an "isEmployee" mental model. */
  isEmployee: boolean;

  // ─── Employee profile (null for admin; undefined while loading) ──────────
  profile: EmployeeProfileData | null | undefined;
  isProfileLoading: boolean;
  profileError: Error | null;

  // ─── Actions ─────────────────────────────────────────────────────────────
  login: ReturnType<typeof useAuth>["login"];
  logout: ReturnType<typeof useAuth>["logout"];
}

/**
 * Single source of truth for the current user's identity, role, and profile.
 *
 * Rules:
 * - Admin users: profile is always null, /profile/me is never called.
 * - Field users: profile is fetched only after auth has fully resolved.
 * - While auth is loading: isAuthenticated=false, all data is null/undefined.
 *
 * Usage:
 *   const { isAdmin, isAuthenticated, profile, isLoading } = useCurrentUser();
 */
export function useCurrentUser(): CurrentUser {
  const auth = useAuth();
  const _isAdmin = isAdmin(auth.role);
  const _isFieldRole = isFieldRole(auth.role);

  const {
    data: profile,
    isLoading: isProfileLoading,
    error: profileError,
  } = useMyProfile({
    // Only fetch after auth has resolved and only for non-admin roles.
    enabled: !auth.isLoading && !!auth.session && _isFieldRole,
  });

  return {
    user: auth.user,
    session: auth.session,
    role: auth.role,
    permissions: auth.permissions,
    isLoading: auth.isLoading,

    isAuthenticated: !auth.isLoading && !!auth.session,
    isAdmin: _isAdmin,
    isFieldRole: _isFieldRole,
    isEmployee: _isFieldRole,

    profile: _isAdmin ? null : profile,
    isProfileLoading: _isAdmin ? false : isProfileLoading,
    profileError: _isAdmin ? null : (profileError as Error | null),

    login: auth.login,
    logout: auth.logout,
  };
}
