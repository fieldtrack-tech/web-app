import type { ArrivalFix } from "@/lib/api/field-operations";

export async function capturePreciseLocation(): Promise<ArrivalFix> {
  if (!navigator.geolocation) throw new Error("Precise location is unavailable on this device.");

  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, (error) => {
      const message = error.code === 1
        ? "Allow precise location in your browser and device settings."
        : "Could not get a GPS fix. Move to an open area and try again.";
      reject(new Error(message));
    }, { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 });
  });
  const { latitude, longitude, accuracy } = position.coords;
  const age = Date.now() - position.timestamp;
  if (!Number.isFinite(accuracy) || accuracy < 0 || accuracy > 100) throw new Error("GPS accuracy is too low. Move to an open area and try again.");
  if (!Number.isFinite(age) || age > 60_000 || age < -30_000) throw new Error("Could not get a fresh GPS fix. Try again.");

  return { latitude, longitude, accuracy, recorded_at: new Date(position.timestamp).toISOString() };
}

const BROWSER_SHIFT_KEY = "fieldtrack:browser-shift";
let browserShiftId: string | null = null;

export function rememberBrowserShift(sessionId: string | null) {
  browserShiftId = sessionId;
  try {
    if (sessionId) sessionStorage.setItem(BROWSER_SHIFT_KEY, sessionId);
    else sessionStorage.removeItem(BROWSER_SHIFT_KEY);
  } catch {
    // Tracking can continue in memory with browser storage disabled.
  }
}

export function isBrowserShift(sessionId: string) {
  if (browserShiftId === sessionId) return true;
  try {
    return sessionStorage.getItem(BROWSER_SHIFT_KEY) === sessionId;
  } catch {
    return false;
  }
}
