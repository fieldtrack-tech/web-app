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
      const detail = (event as CustomEvent<{ message?: string; code?: string; requestId?: string }>).detail;

      let title = "Something went wrong";
      let description = detail?.message ?? "An unexpected error occurred.";

      if (detail.code === "VALIDATION_ERROR") {
        title = "Validation Error";
      } else if (detail.code === "FORBIDDEN") {
        title = "Access Denied";
        description = "You don't have permission to perform this action.";
      } else if (detail.code === "NETWORK_ERROR") {
        title = "Connection Error";
        description = "Check your internet connection and try again.";
      } else if (detail.code === "TIMEOUT") {
        title = "Request Timed Out";
        description = "The server took too long to respond. Please try again.";
      }

      if (detail.requestId) {
        description = `${description}\nError ID: ${detail.requestId}`;
      }

      toast({ variant: "destructive", title, description });
    }

    window.addEventListener("fieldtrack:query-error", handleEvent);
    return () => window.removeEventListener("fieldtrack:query-error", handleEvent);
  }, [toast]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange={false}
    >
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
