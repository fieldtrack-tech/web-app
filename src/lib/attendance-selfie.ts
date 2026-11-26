export const COMPANY_CURRENCY = "INR";
export const COMPANY_TIMEZONE = "Asia/Kolkata";
export const COMPANY_TIMEZONE_LABEL = "IST (UTC+05:30)";

export type SelfieLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
  captured_at: string;
  location_at: string;
};

export function companyDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: COMPANY_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const part = (name: string) => parts.find((p) => p.type === name)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function istTime(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: COMPANY_TIMEZONE, year: "numeric", month: "short", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).format(new Date(value));
}

export function selfieStampLines(location: SelfieLocation): string[] {
  return [
    "FieldTrack | Start work",
    `GPS: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
    `Accuracy: +/- ${Math.ceil(location.accuracy)} m`,
    `Photo: ${istTime(location.captured_at)} IST (UTC+05:30)`,
    `GPS fix: ${istTime(location.location_at)} IST (UTC+05:30)`,
  ];
}

/** Embed standard GPS EXIF as well as the visible stamp. Canvas JPEGs have no
 * camera EXIF to preserve; insert a little-endian EXIF APP1 segment after SOI. */
export function embedGpsExif(jpeg: Uint8Array, location: SelfieLocation): Uint8Array {
  if (jpeg[0] !== 0xff || jpeg[1] !== 0xd8) throw new Error("Selfie encoding did not produce a JPEG.");
  const fixTime = new Date(location.location_at);
  if (!Number.isFinite(fixTime.getTime()) || !Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)
    || Math.abs(location.latitude) > 90 || Math.abs(location.longitude) > 180) throw new Error("Invalid selfie GPS metadata.");

  const gpsOffset = 26;
  const dataOffset = gpsOffset + 2 + 7 * 12 + 4;
  const latitudeOffset = dataOffset;
  const longitudeOffset = latitudeOffset + 24;
  const timeOffset = longitudeOffset + 24;
  const dateOffset = timeOffset + 24;
  const tiff = new Uint8Array(dateOffset + 11);
  const view = new DataView(tiff.buffer);
  const u16 = (offset: number, value: number) => view.setUint16(offset, value, true);
  const u32 = (offset: number, value: number) => view.setUint32(offset, value, true);
  const entry = (offset: number, tag: number, type: number, count: number, value: number) => {
    u16(offset, tag); u16(offset + 2, type); u32(offset + 4, count); u32(offset + 8, value);
  };
  tiff.set([0x49, 0x49]); u16(2, 42); u32(4, 8);
  u16(8, 1); entry(10, 0x8825, 4, 1, gpsOffset);
  u16(gpsOffset, 7);
  const entries = gpsOffset + 2;
  entry(entries, 0, 1, 4, 0x00000302); // GPSVersionID = 2.3.0.0
  entry(entries + 12, 1, 2, 2, location.latitude < 0 ? 0x53 : 0x4e);
  entry(entries + 24, 2, 5, 3, latitudeOffset);
  entry(entries + 36, 3, 2, 2, location.longitude < 0 ? 0x57 : 0x45);
  entry(entries + 48, 4, 5, 3, longitudeOffset);
  entry(entries + 60, 7, 5, 3, timeOffset);
  entry(entries + 72, 29, 2, 11, dateOffset);
  const rational = (offset: number, numerator: number, denominator = 1) => { u32(offset, numerator); u32(offset + 4, denominator); };
  const coordinate = (offset: number, value: number) => {
    // Integer microseconds keep rational seconds < 60, including rounding near a degree boundary.
    const microseconds = Math.round(Math.abs(value) * 3600 * 1_000_000);
    const degrees = Math.floor(microseconds / 3_600_000_000);
    const remainder = microseconds % 3_600_000_000;
    rational(offset, degrees); rational(offset + 8, Math.floor(remainder / 60_000_000));
    rational(offset + 16, remainder % 60_000_000, 1_000_000);
  };
  coordinate(latitudeOffset, location.latitude); coordinate(longitudeOffset, location.longitude);
  rational(timeOffset, fixTime.getUTCHours()); rational(timeOffset + 8, fixTime.getUTCMinutes());
  rational(timeOffset + 16, fixTime.getUTCSeconds() * 1000 + fixTime.getUTCMilliseconds(), 1000);
  tiff.set(new TextEncoder().encode(fixTime.toISOString().slice(0, 10).replace(/-/g, ":")), dateOffset);

  const segment = new Uint8Array(10 + tiff.length);
  segment.set([0xff, 0xe1]); new DataView(segment.buffer).setUint16(2, segment.length - 2);
  segment.set([0x45, 0x78, 0x69, 0x66, 0, 0], 4); segment.set(tiff, 10);
  const stampedJpeg = new Uint8Array(jpeg.length + segment.length);
  stampedJpeg.set(jpeg.subarray(0, 2)); stampedJpeg.set(segment, 2); stampedJpeg.set(jpeg.subarray(2), 2 + segment.length);
  return stampedJpeg;
}

/** Append a high-contrast footer instead of obscuring the employee's face. */
export async function stampAttendanceSelfie(photo: HTMLCanvasElement, location: SelfieLocation): Promise<Blob> {
  const lines = selfieStampLines(location);
  const fontSize = Math.max(12, Math.floor(photo.width * 0.026));
  const padding = Math.max(12, Math.floor(photo.width * 0.025));
  const lineHeight = Math.ceil(fontSize * 1.5);
  const canvas = document.createElement("canvas");
  canvas.width = photo.width; canvas.height = photo.height + padding * 2 + lineHeight * lines.length;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not stamp the attendance selfie.");
  context.drawImage(photo, 0, 0);
  context.fillStyle = "#111827"; context.fillRect(0, photo.height, canvas.width, canvas.height - photo.height);
  context.fillStyle = "#ffffff"; context.textBaseline = "top"; context.font = `${fontSize}px sans-serif`;
  lines.forEach((line, index) => context.fillText(line, padding, photo.height + padding + index * lineHeight, canvas.width - padding * 2));
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => b ? resolve(b) : reject(new Error("Selfie encoding failed")), "image/jpeg", 0.85));
  const bytes = embedGpsExif(new Uint8Array(await blob.arrayBuffer()), location);
  if (bytes.length > 5 * 1024 * 1024) throw new Error("Stamped selfie is larger than 5 MB. Try a lower camera resolution.");
  return new Blob([bytes.buffer as ArrayBuffer], { type: "image/jpeg" });
}
