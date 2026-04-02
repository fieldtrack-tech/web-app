"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { derivePermissions } from "@/lib/permissions";
import { extractRoleFromSession } from "@/lib/auth/role";
import type { UserPermissions, UserRole } from "@/types";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  permissions: UserPermissions;
  isLoading: boolean;
}

const defaultPermissions: UserPermissions = {
  viewSessions: false,
  viewLocations: false,
  viewExpenses: false,
  viewAnalytics: false,
  viewOrgSessions: false,
  viewOrgExpenses: false,
  manageExpenses: false,
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  role: null,
  permissions: defaultPermissions,
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions>(defaultPermissions);
  const [isLoading, setIsLoading] = useState(true);

  function applySession(s: Session | null) {
    setSession(s);
    setUser(s?.user ?? null);

    if (s) {
      const resolvedRole = extractRoleFromSession(s, { allowUserMetadataFallback: true });
      setRole(resolvedRole);
      setPermissions(derivePermissions(resolvedRole));
    } else {
      setRole(null);
      setPermissions(defaultPermissions);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session: s } }: { data: { session: Session | null } }) => {
        applySession(s);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, s: Session | null) => {
      applySession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      session,
      role,
      permissions,
      isLoading,
    };
  }, [user, session, role, permissions, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  return useContext(AuthContext);
}
