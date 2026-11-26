"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuthContext } from "@/contexts/AuthContext";
import { extractRoleFromSession } from "@/lib/auth/role";
import type { UserRole } from "@/types";

export function useAuth() {
  const router = useRouter();
  const { user, session, role, permissions, isLoading } = useAuthContext();

  const login = useCallback(
    async (email: string, password: string): Promise<UserRole> => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      if (!data.session) return "EMPLOYEE";
      return extractRoleFromSession(data.session);
    },
    []
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/login");
  }, [router]);

  return { user, session, role, permissions, isLoading, login, logout };
}
