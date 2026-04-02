"use client";

import { useEffect } from "react";

export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[FieldTrack] Unhandled protected-route error:", error);
  }, [error]);

  return (
    <div className="card max-w-xl mx-auto mt-8 text-center space-y-4">
      <h2 className="font-manrope text-2xl font-bold text-on-surface">Something went wrong</h2>
      <p className="text-sm text-on-surface-variant">The protected view failed to load. You can retry now.</p>
      <button className="btn-primary mx-auto" onClick={() => reset()}>
        Try Again
      </button>
    </div>
  );
}
