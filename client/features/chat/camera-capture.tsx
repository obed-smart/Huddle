"use client";

import { useEffect, useRef, useState } from "react";
import { SwitchCamera, X } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = { onCapture: (file: File) => void; onClose: () => void };

/** A full screen camera: a live preview, a shutter that grabs the current frame
    as a JPEG, and a flip between the front and rear camera. The camera needs a
    secure context (https or localhost); on plain http the browser hides it and
    we say so instead of failing silently. */
export function CameraCapture({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function open() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("The camera needs a secure connection. Open the app over https or on localhost.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: false });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        setError("Could not open the camera.");
      }
    }
    open();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facing]);

  function shoot() {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" }));
        onClose();
      },
      "image/jpeg",
      0.9,
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black text-white">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close camera"
        className="absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-full bg-black/40 backdrop-blur-sm"
        style={{ top: "max(1rem, env(safe-area-inset-top))" }}
      >
        <X className="size-6" />
      </button>

      {error ? (
        <div className="grid flex-1 place-items-center px-8 text-center text-sm text-white/80">{error}</div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={cn("size-full flex-1 object-cover", facing === "user" && "-scale-x-100")}
          />
          <div
            className="absolute inset-x-0 bottom-0 flex items-center justify-center pb-10"
            style={{ paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))" }}
          >
            <button
              type="button"
              onClick={shoot}
              aria-label="Take photo"
              className="size-18 rounded-full border-4 border-white/80 bg-white/25 transition-transform active:scale-95"
            />
            <button
              type="button"
              onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
              aria-label="Switch camera"
              className="absolute right-10 grid size-12 place-items-center rounded-full bg-black/40 backdrop-blur-sm"
            >
              <SwitchCamera className="size-6" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
