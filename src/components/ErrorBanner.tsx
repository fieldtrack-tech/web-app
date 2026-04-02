"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export function ErrorBanner({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  const message =
    error instanceof Error ? error.message : "Something went wrong. Please try again.";

  return (
    <div className="card border border-error/30 bg-error/10 flex items-start gap-3">
      <AlertTriangle className="w-4 h-4 text-error mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-error">Request Failed</p>
        <p className="text-xs text-error/90 mt-1 break-words">{message}</p>
      </div>
      {onRetry ? (
        <button className="btn-secondary h-8 px-2.5 text-xs" onClick={onRetry}>
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      ) : null}
    </div>
  );
}
