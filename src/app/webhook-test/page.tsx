"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { AuthCard } from "@/components/webhook-test/AuthCard";
import { WebhookSetupCard } from "@/components/webhook-test/WebhookSetupCard";
import { TriggerEventCard } from "@/components/webhook-test/TriggerEventCard";
import { DeliveryPanel } from "@/components/webhook-test/DeliveryPanel";

export default function WebhookTestPage() {
  const { session, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!session) {
      router.replace("/login?next=/webhook-test");
      return;
    }
    if (role !== "ADMIN") {
      router.replace("/employee/dashboard");
    }
  }, [session, isLoading, role, router]);

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <LoadingSkeleton variant="card" className="h-64" />
      </div>
    );
  }

  if (!session || role !== "ADMIN") return null;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-manrope text-3xl font-bold text-on-surface">Webhook Test Tool</h1>
            <p className="text-sm text-on-surface-variant">Internal admin-only debugging utility.</p>
          </div>
          <span className="badge-error">ADMIN ONLY</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <AuthCard />
          <WebhookSetupCard />
        </div>

        <TriggerEventCard />
        <DeliveryPanel />
      </div>
    </div>
  );
}
