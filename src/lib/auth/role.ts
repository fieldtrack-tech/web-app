import type { Session } from "@supabase/supabase-js";
import type { UserRole } from "@/types";

function toUserRole(value: unknown): UserRole | undefined {
  if (
    value === "ADMIN" ||
    value === "EMPLOYEE"
  ) {
    return value;
  }
  return undefined;
}

function decodeBase64Url(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  if (typeof atob === "function") {
    return atob(padded);
  }

  const nodeBuffer = (
    globalThis as {
      Buffer?: {
        from: (data: string, enc: string) => { toString: (enc: string) => string };
      };
    }
  ).Buffer;

  if (!nodeBuffer) {
    throw new Error("No base64 decoder available in current runtime");
  }

  return nodeBuffer.from(padded, "base64").toString("utf-8");
}

export function extractRoleFromAccessToken(
  accessToken: string | null | undefined
): UserRole | undefined {
  return toUserRole(accessTokenClaims(accessToken)?.role);
}

function accessTokenClaims(accessToken: string | null | undefined): Record<string, unknown> | undefined {
  if (!accessToken) return undefined;

  try {
    const parts = accessToken.split(".");
    if (parts.length < 2) return undefined;
    return JSON.parse(decodeBase64Url(parts[1])) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

export function sessionIdentityKey(session: Session): string {
  const claims = accessTokenClaims(session.access_token);
  return JSON.stringify([session.user.id, claims?.org_id, claims?.employee_id, extractRoleFromSession(session)]);
}

export function extractRoleFromSession(session: Session): UserRole {
  const claimRole = extractRoleFromAccessToken(session.access_token);
  if (claimRole) return claimRole;

  const appMetaRole = toUserRole(
    (session.user.app_metadata as Record<string, unknown> | undefined)?.role
  );
  if (appMetaRole) return appMetaRole;

  return "EMPLOYEE";
}

// ─── Role predicate helpers ──────────────────────────────────────────────────
// Use these instead of inline string comparisons so a future role name change
// is caught by TypeScript at the single definition site.

export function isAdmin(role: UserRole | null | undefined): boolean {
  return role === "ADMIN";
}

/**
 * Returns true for any non-admin field role (currently only EMPLOYEE).
 */
export function isFieldRole(role: UserRole | null | undefined): boolean {
  return role === "EMPLOYEE";
}
