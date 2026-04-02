"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardCompatPage() {
  const { role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (role === "ADMIN") router.replace("/admin/dashboard");
    else router.replace("/employee/dashboard");
  }, [role, isLoading, router]);

  return null;
}
