"use client";

import { Download, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { downloadFile } from "@/lib/media/download";

/** Human file size, e.g. "1.4 MB". Empty when unknown. */
export function formatSize(bytes: number): string {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

/** Save the file to the device. Kept from triggering the parent. */
export function DownloadButton({ src, name, dark }: { src: string; name: string; dark: boolean }) {
  return (
    <button
      type="button"
      aria-label={`Save ${name}`}
      onClick={(e) => {
        e.stopPropagation();
        downloadFile(src, name);
      }}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-full transition-colors",
        dark
          ? "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30"
          : "bg-foreground/5 text-foreground hover:bg-foreground/10",
      )}
    >
      <Download className="size-4" />
    </button>
  );
}

/** The round control that loads a not-yet-downloaded attachment on tap. Shows a
    spinner while the bytes come down. */
export function LoadButton({
  loading,
  onLoad,
  dark,
}: {
  loading: boolean;
  onLoad: () => void;
  dark: boolean;
}) {
  return (
    <button
      type="button"
      aria-label="Download"
      disabled={loading}
      onClick={(e) => {
        e.stopPropagation();
        onLoad();
      }}
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full transition-colors",
        dark
          ? "bg-primary-foreground/25 text-primary-foreground hover:bg-primary-foreground/35"
          : "bg-primary/10 text-primary hover:bg-primary/20",
      )}
    >
      {loading ? <Loader2 className="size-5 animate-spin" /> : <Download className="size-5" />}
    </button>
  );
}

/** The shared horizontal card for voice, video, and file attachments. */
export function Card({
  icon,
  title,
  meta,
  mine,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  meta: string;
  mine: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex w-60 items-center gap-3">
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-lg",
          mine ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary",
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        {meta ? <p className="truncate text-xs opacity-75">{meta}</p> : null}
      </div>
      {action}
    </div>
  );
}
