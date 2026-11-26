"use client";

import { createContext, Fragment, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { derivePermissions } from "@/lib/permissions";
import { extractRoleFromSession, sessionIdentityKey } from "@/lib/auth/role";
import { setApiSession } from "@/lib/api/client";
import type { UserPermissions, UserRole } from "@/types";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  identityKey: string | null;
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
  identityKey: null,
  role: null,
  permissions: defaultPermissions,
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const previousIdentity = useRef<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      const nextIdentity = nextSession ? sessionIdentityKey(nextSession) : null;
      setApiSession(nextSession, nextIdentity);
      if (previousIdentity.current !== nextIdentity) {
        previousIdentity.current = nextIdentity;
        void queryClient.cancelQueries();
        queryClient.clear();
      }
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(() => {
    const role = session ? extractRoleFromSession(session) : null;
    return {
      user: session?.user ?? null,
      session,
      identityKey: session ? sessionIdentityKey(session) : null,
      role,
      permissions: role ? derivePermissions(role) : defaultPermissions,
      isLoading,
    };
  }, [session, isLoading]);

  return <AuthContext.Provider value={value}><Fragment key={value.identityKey}>{children}</Fragment></AuthContext.Provider>;
}

export function useAuthContext() {
  return useContext(AuthContext);
}
