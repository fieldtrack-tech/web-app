"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { clearAuthTokenCache } from "@/lib/api/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { extractRoleFromSession } from "@/lib/auth/role";
import { queryClient } from "@/lib/query-client";
import type { UserRole } from "@/types";

export function useAuth() {
  const router = useRouter();
  const { user, session, role, permissions, isLoading } = useAuthContext();

  const login = useCallback(
    async (email: string, password: string): Promise<UserRole> => {
      // Clear cached bearer to avoid stale cross-role token reuse
      clearAuthTokenCache();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      if (!data.session) return "EMPLOYEE";
      return extractRoleFromSession(data.session, { allowUserMetadataFallback: true });
    },
    []
  );

  const logout = useCallback(async () => {
    clearAuthTokenCache();
    await supabase.auth.signOut();
    queryClient.clear();
    router.push("/login");
  }, [router]);

  return { user, session, role, permissions, isLoading, login, logout };
}
