"use client";

import { useRef, useState } from "react";
import { Camera, FileUp, Image as ImageIcon, Mic, Plus, Video } from "lucide-react";

import { cn } from "@/lib/utils";
import { PICKERS, type ServerKind } from "@/lib/media/policy";
import { CameraCapture } from "./camera-capture";

const ICONS: Record<string, typeof ImageIcon> = { photo: ImageIcon, video: Video, audio: Mic, file: FileUp };
const TINTS: Record<string, string> = {
  photo: "text-violet-500",
  camera: "text-rose-500",
  video: "text-sky-500",
  audio: "text-amber-500",
  file: "text-emerald-500",
};

type Props = { onStage: (files: File[], kind: ServerKind) => void; disabled?: boolean };
type Picker = (typeof PICKERS)[number];
type Option = { key: string; label: string; icon: typeof ImageIcon; picker?: Picker };

/** The composer's "+". On a phone it opens a sheet that slides up from the
    bottom; on desktop it is a small dropup. Besides the photo, video, audio, and
    PDF pickers it offers Camera, which captures a photo in the app. */
export function MediaMenu({ onStage, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [camera, setCamera] = useState(false);
  const [active, setActive] = useState(PICKERS[0]);
  const inputRef = useRef<HTMLInputElement>(null);

  function choose(o: Option) {
    if (!o.picker) {
      setOpen(false);
      setCamera(true);
      return;
    }
    setActive(o.picker);
    setOpen(false);
    // Let the accept/multiple attributes apply before the picker opens.
    requestAnimationFrame(() => inputRef.current?.click());
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length) onStage(files, active.kind);
  }

  const photo = PICKERS.find((p) => p.key === "photo");
  const rest = PICKERS.filter((p) => p.key !== "photo");
  const options: Option[] = [
    ...(photo ? [{ key: "photo", label: photo.label, icon: ImageIcon, picker: photo }] : []),
    { key: "camera", label: "Camera", icon: Camera },
    ...rest.map((p) => ({ key: p.key, label: p.label, icon: ICONS[p.key] ?? FileUp, picker: p })),
  ];

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Add media"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary active:scale-95 disabled:opacity-40"
      >
        <Plus className={cn("size-5 transition-transform", open && "rotate-45")} />
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute bottom-full left-0 z-50 mb-2 hidden w-44 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg md:block">
            {options.map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => choose(o)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-secondary"
              >
                <o.icon className={cn("size-4", TINTS[o.key] ?? "text-muted-foreground")} />
                {o.label}
              </button>
            ))}
          </div>

          <div
            className="animate-sheet-up fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-border bg-popover px-6 pt-4 shadow-2xl md:hidden"
            style={{ paddingBottom: "max(1.75rem, env(safe-area-inset-bottom))" }}
          >
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-muted-foreground/25" />
            <div className="grid grid-cols-4 gap-x-4 gap-y-5">
              {options.map((o) => (
                <button key={o.key} type="button" onClick={() => choose(o)} className="flex flex-col items-center gap-2">
                  <span className="grid size-14 place-items-center rounded-2xl bg-secondary active:scale-95">
                    <o.icon className={cn("size-6", TINTS[o.key] ?? "text-foreground")} />
                  </span>
                  <span className="text-xs text-muted-foreground">{o.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {camera ? (
        <CameraCapture onCapture={(file) => onStage([file], "image")} onClose={() => setCamera(false)} />
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept={active.accept}
        multiple={active.multiple}
        onChange={onChange}
        className="hidden"
      />
    </div>
  );
}
