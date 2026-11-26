"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useActiveShift } from "@/hooks/queries/useSessions";
import { useBrowserShiftTracking } from "@/hooks/useBrowserShiftTracking";
import { isBrowserShift } from "@/lib/browser-location";

const TrackingStatus = createContext<string | null>(null);

export function useBrowserTrackingStatus() {
  return useContext(TrackingStatus);
}

export function BrowserShiftTracking({ children }: { children?: ReactNode }) {
  const { data } = useActiveShift();
  const session = data?.data[0];
  const browserSessionId = session && !session.checkout_at && isBrowserShift(session.id) ? session.id : null;
  const status = useBrowserShiftTracking(browserSessionId);
  return <TrackingStatus.Provider value={browserSessionId ? status : null}>{children}</TrackingStatus.Provider>;
}
