"use client";

import { useAuth } from "@/hooks/useAuth";

export function AuthCard() {
  const { user, role, session } = useAuth();
  const token = session?.access_token ?? "";

  return (
    <div className="card space-y-3">
      <h3 className="font-manrope font-bold text-on-surface">Auth Context</h3>
      <p className="text-sm text-on-surface-variant">Signed in as {user?.email ?? "-"}</p>
      <p className="text-xs text-on-surface-variant">Role: <span className="badge-info">{role ?? "UNKNOWN"}</span></p>
      <p className="text-xs font-mono text-on-surface-variant break-all">Token: {token ? `${token.slice(0, 32)}...` : "none"}</p>
    </div>
  );
}
