"use client";

import { useRef, useState } from "react";
import { FileUp, Image as ImageIcon, Mic, Plus, Video } from "lucide-react";

import { cn } from "@/lib/utils";
import { PICKERS, type ServerKind } from "@/lib/media/policy";

const ICONS: Record<string, typeof ImageIcon> = {
  photo: ImageIcon,
  video: Video,
  audio: Mic,
  file: FileUp,
};

type Props = { onStage: (files: File[], kind: ServerKind) => void; disabled?: boolean };

/** The composer's "+" offering photo, video, audio, and PDF pickers. "Photo"
    opens the gallery directly; the chosen files are validated by the composer. */
export function MediaMenu({ onStage, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(PICKERS[0]);
  const inputRef = useRef<HTMLInputElement>(null);

  function pick(picker: (typeof PICKERS)[number]) {
    setActive(picker);
    setOpen(false);
    // Let the accept/multiple attributes apply before the picker opens.
    requestAnimationFrame(() => inputRef.current?.click());
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length) onStage(files, active.kind);
  }

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
          <div className="absolute bottom-full left-0 z-50 mb-2 w-40 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg">
            {PICKERS.map((picker) => {
              const Icon = ICONS[picker.key] ?? FileUp;
              return (
                <button
                  key={picker.key}
                  type="button"
                  onClick={() => pick(picker)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-secondary"
                >
                  <Icon className="size-4 text-muted-foreground" />
                  {picker.label}
                </button>
              );
            })}
          </div>
        </>
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
