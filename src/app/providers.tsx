"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { validateEnv } from "@/lib/env";
import { useEffect, type ReactNode } from "react";

function EnvValidator({ children }: { children: ReactNode }) {
  useEffect(() => {
    validateEnv();
  }, []);

  return <>{children}</>;
}

function GlobalErrorToast() {
  const { toast } = useToast();

  useEffect(() => {
    function handleEvent(event: Event) {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: detail?.message ?? "An unexpected error occurred.",
      });
    }

    window.addEventListener("fieldtrack:query-error", handleEvent);
    return () => window.removeEventListener("fieldtrack:query-error", handleEvent);
  }, [toast]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <EnvValidator>
            {children}
            <GlobalErrorToast />
            <Toaster />
          </EnvValidator>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
