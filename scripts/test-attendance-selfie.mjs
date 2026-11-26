import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { test } from "node:test";
import ts from "typescript";

// Test pure TypeScript helpers without adding a frontend test framework or
// accessing employee photos, GPS, camera hardware, credentials or the network.
const source = await readFile(new URL("../src/lib/attendance-selfie.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const { companyDate, selfieStampLines, embedGpsExif, stampAttendanceSelfie } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
const location = { latitude: 19.076, longitude: 72.8777, accuracy: 6.2,
  captured_at: "2026-11-24T20:45:12Z", location_at: "2026-11-24T20:45:10.125Z" };
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

function readGps(bytes) {
  assert.equal(bytes[2], 0xff); assert.equal(bytes[3], 0xe1);
  assert.equal(new TextDecoder().decode(bytes.subarray(6, 12)), "Exif\0\0");
  const view = new DataView(bytes.buffer, bytes.byteOffset + 12);
  assert.equal(view.getUint16(2, true), 42);
  const ifd0 = view.getUint32(4, true);
  assert.equal(view.getUint16(ifd0 + 2, true), 0x8825);
  const gps = view.getUint32(ifd0 + 10, true);
  const entries = new Map();
  for (let i = 0; i < view.getUint16(gps, true); i++) {
    const offset = gps + 2 + 12 * i;
    entries.set(view.getUint16(offset, true), { offset, type: view.getUint16(offset + 2, true), count: view.getUint32(offset + 4, true), value: view.getUint32(offset + 8, true) });
  }
  const rationals = (tag) => {
    const entry = entries.get(tag); assert.equal(entry.type, 5); assert.equal(entry.count, 3);
    return [0, 1, 2].map((i) => view.getUint32(entry.value + i * 8, true) / view.getUint32(entry.value + i * 8 + 4, true));
  };
  const coordinate = (tag) => { const [d, m, s] = rationals(tag); assert.ok(m < 60 && s < 60); return d + m / 60 + s / 3600; };
  const latitudeRef = String.fromCharCode(view.getUint8(entries.get(1).offset + 8));
  const longitudeRef = String.fromCharCode(view.getUint8(entries.get(3).offset + 8));
  const dateEntry = entries.get(29);
  return { latitude: coordinate(2) * (latitudeRef === "S" ? -1 : 1), longitude: coordinate(4) * (longitudeRef === "W" ? -1 : 1),
    time: rationals(7), date: new TextDecoder().decode(new Uint8Array(view.buffer, view.byteOffset + dateEntry.value, dateEntry.count - 1)) };
}

test("company date follows IST across midnight and month/year boundaries", () => {
  assert.equal(companyDate(new Date("2026-11-24T20:45:00Z")), "2026-11-25");
  assert.equal(companyDate(new Date("2026-11-30T20:00:00Z")), "2026-12-01");
  assert.equal(companyDate(new Date("2026-12-31T20:00:00Z")), "2027-01-01");
});
test("visible footer includes exact GPS fix, accuracy and distinct photo/GPS times in IST", () => {
  const lines = selfieStampLines(location);
  assert.equal(lines[1], "GPS: 19.076000, 72.877700");
  assert.equal(lines[2], "Accuracy: +/- 7 m");
  assert.match(lines[3], /25 Nov 2026.*02:15:12.*IST \(UTC\+05:30\)/);
  assert.match(lines[4], /25 Nov 2026.*02:15:10.*IST \(UTC\+05:30\)/);
});
for (const [latitude, longitude] of [[19.076, 72.8777], [-33.8688, 151.2093], [40.7128, -74.006], [-1.5, -2.75], [0, 0], [90, 180], [89.999999999999, -179.999999999999]]) {
  test(`GPS EXIF round-trips coordinates ${latitude}, ${longitude} without corrupting JPEG bytes`, () => {
    const bytes = embedGpsExif(jpeg, { ...location, latitude, longitude });
    assert.equal(bytes[0], 0xff); assert.equal(bytes[1], 0xd8);
    assert.deepEqual(bytes.subarray(bytes.length - 2), jpeg.subarray(2));
    assert.equal(new DataView(bytes.buffer).getUint16(4), bytes.length - jpeg.length - 2);
    const gps = readGps(bytes);
    assert.ok(Math.abs(gps.latitude - latitude) < 1e-8); assert.ok(Math.abs(gps.longitude - longitude) < 1e-8);
    assert.equal(gps.date, "2026:11:24"); assert.deepEqual(gps.time, [20, 45, 10.125]);
  });
}
test("invalid JPEG/GPS cannot be uploaded as a geotagged selfie", () => {
  assert.throws(() => embedGpsExif(new Uint8Array([0, 1]), location), /JPEG/);
  assert.throws(() => embedGpsExif(jpeg, { ...location, latitude: 91 }), /Invalid/);
  assert.throws(() => embedGpsExif(jpeg, { ...location, longitude: NaN }), /Invalid/);
  assert.throws(() => embedGpsExif(jpeg, { ...location, location_at: "bad" }), /Invalid/);
});
test("stamp is appended below the selfie and the final upload contains GPS EXIF", async () => {
  const calls = [];
  const canvas = { width: 0, height: 0, getContext: () => ({ drawImage: (...args) => calls.push(["photo", ...args]),
    fillRect: (...args) => calls.push(["footer", ...args]), fillText: (...args) => calls.push(["text", ...args]) }),
    toBlob: (callback) => callback(new Blob([jpeg], { type: "image/jpeg" })) };
  const originalDocument = globalThis.document;
  globalThis.document = { createElement: () => canvas };
  try {
    const photo = { width: 720, height: 960 };
    const blob = await stampAttendanceSelfie(photo, location);
    assert.equal(canvas.width, 720); assert.ok(canvas.height > 960);
    assert.equal(calls.find((call) => call[0] === "footer")[2], 960);
    assert.equal(calls.filter((call) => call[0] === "text").length, 5);
    assert.ok(calls.filter((call) => call[0] === "text").every((call) => call[3] > photo.height));
    assert.equal(blob.type, "image/jpeg"); assert.ok(Math.abs(readGps(new Uint8Array(await blob.arrayBuffer())).latitude - location.latitude) < 1e-8);
  } finally { if (originalDocument === undefined) delete globalThis.document; else globalThis.document = originalDocument; }
});
