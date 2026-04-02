"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { EmployeeSidebar } from "@/components/layout/EmployeeSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Spinner } from "@/components/ui";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { isLoading, role, user } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) return null;

  const isAdmin = role === "ADMIN";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      {isAdmin ? (
        <AdminSidebar isMobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      ) : (
        <EmployeeSidebar isMobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar">{children}</main>
      </div>
    </div>
  );
}
