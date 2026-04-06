"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Custom fallback rendered when an error is caught. Receives reset callback. */
  fallback?: (reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches render-time errors from descendant components and shows a recovery UI.
 * Place this around any section that should not crash the entire page.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Log in all environments. In production this surfaces to error monitoring
    // tools (Sentry, Datadog, etc.) if a global handler is registered.
    console.error("[FieldTrack] UI crash caught by ErrorBoundary:", error.message, {
      componentStack: info.componentStack.trim().split("\n").slice(0, 5).join("\n"),
    });
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.reset);
      }
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] space-y-3 p-8 text-center">
          <p className="font-manrope font-bold text-on-surface">Something went wrong</p>
          <p className="text-sm text-on-surface-variant max-w-sm">
            {this.state.error?.message ?? "An unexpected error occurred in this section."}
          </p>
          <button className="btn-secondary text-sm" onClick={this.reset}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
