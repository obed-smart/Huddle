"use client";

import { useRef, useState } from "react";
import { FileUp, Image as ImageIcon, Mic, Plus, Video } from "lucide-react";

import { cn } from "@/lib/utils";
import { toast } from "@/lib/notify";

/* Each option opens the matching native picker. "image/*" opens the photo
   gallery straight away on mobile rather than a file browser. Uploading the
   chosen file lands in the next section, so for now a pick is acknowledged. */
const OPTIONS = [
  { key: "photo", label: "Photo", accept: "image/*", icon: ImageIcon },
  { key: "video", label: "Video", accept: "video/*", icon: Video },
  { key: "audio", label: "Audio", accept: "audio/*", icon: Mic },
  { key: "file", label: "File", accept: "*/*", icon: FileUp },
] as const;

/** The composer's "+" that offers photo, video, audio, and file pickers. */
export function MediaMenu() {
  const [open, setOpen] = useState(false);
  const [accept, setAccept] = useState("*/*");
  const inputRef = useRef<HTMLInputElement>(null);

  function pick(nextAccept: string) {
    setOpen(false);
    setAccept(nextAccept);
    // Let the accept attribute apply before the picker opens.
    requestAnimationFrame(() => inputRef.current?.click());
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) toast("Sending media arrives in the next section.");
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Add media"
        onClick={() => setOpen((o) => !o)}
        className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary active:scale-95"
      >
        <Plus className={cn("size-5 transition-transform", open && "rotate-45")} />
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 z-50 mb-2 w-40 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg">
            {OPTIONS.map(({ key, label, accept: a, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => pick(a)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-secondary"
              >
                <Icon className="size-4 text-muted-foreground" />
                {label}
              </button>
            ))}
          </div>
        </>
      ) : null}

      <input ref={inputRef} type="file" accept={accept} onChange={onChange} className="hidden" />
    </div>
  );
}
