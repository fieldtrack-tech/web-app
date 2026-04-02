"use client";

import { useEffect } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[FieldTrack frontend] Unhandled app error:", error);
  }, [error]);

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-background">
      <div className="card max-w-xl w-full text-center space-y-5">
        <div className="space-y-2">
          <h1 className="font-manrope text-2xl font-bold text-on-surface">Something went wrong</h1>
          <p className="text-sm text-on-surface-variant">
            An unexpected error occurred. You can try again or return to the home page.
          </p>
          {error.digest && (
            <p className="text-xs text-on-surface-variant font-mono">Error ID: {error.digest}</p>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <button className="btn-primary" onClick={reset}>
            Try Again
          </button>
          <button className="btn-secondary" onClick={() => (window.location.href = "/") }>
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
