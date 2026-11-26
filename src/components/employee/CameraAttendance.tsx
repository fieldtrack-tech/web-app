"use client";

import { useEffect, useRef, useState } from "react";
import { fieldApi, type CameraCheckIn } from "@/lib/api/field-operations";
import { stampAttendanceSelfie } from "@/lib/attendance-selfie";
import { capturePreciseLocation } from "@/lib/browser-location";

export function CameraAttendance({ onSubmit, onCancel }: { onSubmit: (body: CameraCheckIn) => Promise<unknown>; onCancel: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream>();
  const mounted = useRef(false);
  const uploadAbort = useRef<AbortController>();
  const [challenge, setChallenge] = useState<Awaited<ReturnType<typeof fieldApi.challenge>>>();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    mounted.current = true;
    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera access requires HTTPS and a supported browser.");
        const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 960 } }, audio: false });
        if (cancelled) { media.getTracks().forEach((t) => t.stop()); return; }
        stream.current = media;
        if (video.current) { video.current.srcObject = media; await video.current.play(); }
        const upload = await fieldApi.challenge(); if (!cancelled) setChallenge(upload);
      } catch (e) { if (!cancelled) setError((e as Error).message); }
    }
    void start();
    return () => {
      cancelled = true;
      mounted.current = false;
      uploadAbort.current?.abort();
      stream.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);
  async function capture() {
    if (!video.current || !challenge || busy) return;
    setBusy(true); setError("");
    try {
      if (Date.now() >= Date.parse(challenge.expires_at)) throw new Error("Camera session expired. Close and start again.");
      const { recorded_at, ...fix } = await capturePreciseLocation();
      if (!mounted.current || !video.current) return;
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 1600 / Math.max(video.current.videoWidth, video.current.videoHeight));
      canvas.width = Math.round(video.current.videoWidth * scale); canvas.height = Math.round(video.current.videoHeight * scale);
      if (!canvas.width || !canvas.height) throw new Error("Wait for the live camera preview.");
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Photo capture is unavailable.");
      context.drawImage(video.current, 0, 0, canvas.width, canvas.height);
      const captured_at = new Date().toISOString();
      const location = { ...fix, location_at: recorded_at, captured_at };
      const blob = await stampAttendanceSelfie(canvas, location);
      if (!mounted.current) return;
      const uploadController = new AbortController();
      uploadAbort.current = uploadController;
      const upload = await fetch(challenge.upload_url, { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: blob, credentials: "omit", signal: AbortSignal.any([uploadController.signal, AbortSignal.timeout(30_000)]) });
      if (!upload.ok) throw new Error("Selfie upload failed. Close and take a new photo.");
      if (!mounted.current) return;
      await onSubmit({ challenge_id: challenge.challenge_id, ...location });
      onCancel();
    } catch (e) { if (mounted.current) setError((e as Error).message || "Camera or GPS unavailable. Check permissions."); }
    finally { if (mounted.current) setBusy(false); }
  }
  return <div className="space-y-3">
    <p className="text-sm text-on-surface-variant">Take a live selfie to start work. GPS coordinates, accuracy and capture time in IST (UTC+05:30) are stamped directly onto the saved photo, with GPS also embedded in its metadata. Gallery photos are not accepted.</p>
    <video ref={video} muted playsInline onLoadedData={() => setReady(true)} className="w-full max-h-80 rounded-xl bg-black object-contain" />
    {error && <p role="alert" className="text-error text-sm">{error}</p>}
    <div className="flex gap-2"><button className="btn-primary flex-1" disabled={!ready || !challenge || busy} onClick={capture}>{busy ? "Saving selfie & GPS…" : "Capture selfie & start work"}</button>
      <button className="btn-secondary" disabled={busy} onClick={onCancel}>Cancel</button></div>
  </div>;
}
