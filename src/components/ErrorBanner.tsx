"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { ApiError } from "@/types";

export function ErrorBanner({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  const isApiError = error instanceof ApiError;
  const message = isApiError
    ? error.message
    : error instanceof Error
      ? error.message
      : "Something went wrong. Please try again.";

  const requestId = isApiError ? error.requestId : undefined;

  return (
    <div className="card border border-error/30 bg-error/10 flex items-start gap-3">
      <AlertTriangle className="w-4 h-4 text-error mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-error">Request Failed</p>
        <p className="text-xs text-error/90 mt-1 break-words">{message}</p>
        {requestId && (
          <p className="text-xs text-error/60 mt-1 font-mono">Error ID: {requestId}</p>
        )}
      </div>
      {onRetry ? (
        <button className="btn-secondary h-8 px-2.5 text-xs shrink-0" onClick={onRetry}>
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      ) : null}
    </div>
  );
}
