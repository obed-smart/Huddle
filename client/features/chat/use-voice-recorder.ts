"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { toast } from "@/lib/notify";

/** Pick a mime the recorder and our policy both accept. */
function chooseMime(): string {
  const candidates = ["audio/webm", "audio/ogg", "audio/mp4"];
  if (typeof MediaRecorder === "undefined") return "";
  return candidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
}

function extensionFor(mime: string): string {
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mp4")) return "m4a";
  return "webm";
}

/**
 * Record a single voice note from the microphone. `start` asks for the mic and
 * begins; `stop` ends it and hands back a File to send; `cancel` ends it and
 * throws the recording away. The elapsed seconds tick while recording, and the
 * mic track is always released when it ends.
 */
export function useVoiceRecorder(onComplete: (file: File) => void) {
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);
  const discard = useRef(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const release = useCallback(() => {
    if (ticker.current) clearInterval(ticker.current);
    ticker.current = null;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
  }, []);

  const start = useCallback(async () => {
    if (recorder.current) return;
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = media;
      chunks.current = [];
      discard.current = false;
      const mime = chooseMime();
      const rec = new MediaRecorder(media, mime ? { mimeType: mime } : undefined);
      recorder.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      rec.onstop = () => {
        const type = (rec.mimeType || "audio/webm").split(";")[0];
        const blob = new Blob(chunks.current, { type });
        recorder.current = null;
        release();
        setRecording(false);
        setSeconds(0);
        if (!discard.current && blob.size > 0) {
          onComplete(new File([blob], `voice-note-${Date.now()}.${extensionFor(type)}`, { type }));
        }
      };
      rec.start();
      setRecording(true);
      setSeconds(0);
      ticker.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      release();
      toast("Microphone is not available.");
    }
  }, [onComplete, release]);

  const finish = useCallback((keep: boolean) => {
    discard.current = !keep;
    if (recorder.current?.state === "recording") recorder.current.stop();
  }, []);

  const stop = useCallback(() => finish(true), [finish]);
  const cancel = useCallback(() => finish(false), [finish]);

  // Drop any live recording if the composer unmounts mid-record.
  useEffect(() => {
    return () => {
      discard.current = true;
      if (recorder.current?.state === "recording") recorder.current.stop();
      release();
    };
  }, [release]);

  return { recording, seconds, start, stop, cancel };
}
