"use client";

import type { CSSProperties, ReactNode } from "react";

function baseStyle(): CSSProperties {
  return {
    animationName: "ft-fade-up",
    animationDuration: "360ms",
    animationTimingFunction: "ease-out",
    animationFillMode: "both",
    animationDelay: "0s",
  };
}

export function PageTransition({ children }: { children: ReactNode }) {
  return <div style={baseStyle()}>{children}</div>;
}
