"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { SendHorizonal, Mic, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { toast } from "@/lib/notify";
import { Textarea } from "@/components/ui/textarea";
import { MAX_FILES, validateFile, type ServerKind } from "@/lib/media/policy";
import { createStaged, revokeStaged, type StagedItem } from "@/lib/media/staged";
import { MediaMenu } from "./media-menu";
import { StagedTray } from "./staged-tray";
import { useVoiceRecorder } from "./use-voice-recorder";

type Props = {
  onSend: (text: string) => void;
  onSendMedia: (items: StagedItem[], caption: string) => void;
  onTyping: () => void;
  disabled?: boolean;
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** The message input: media picker, a staged-file tray, a growing text field,
    and send. When the field is empty, send becomes a voice-note button that
    records straight from the mic. Files are validated before they can be sent. */
export function ChatComposer({ onSend, onSendMedia, onTyping, disabled }: Props) {
  const [value, setValue] = useState("");
  const [staged, setStaged] = useState<StagedItem[]>([]);

  const { recording, seconds, start, stop, cancel } = useVoiceRecorder((file) => {
    onSendMedia([createStaged(file, "voice")], "");
  });

  function stage(files: File[], kind: ServerKind) {
    setStaged((prev) => {
      const next = [...prev];
      for (const file of files) {
        if (next.length >= MAX_FILES) {
          toast(`You can attach up to ${MAX_FILES} files.`);
          break;
        }
        // A voice note is sent on its own, never mixed with other files.
        if (kind === "voice" ? next.length > 0 : next.some((s) => s.kind === "voice")) {
          toast("A voice note must be sent on its own.");
          break;
        }
        const error = validateFile(file, kind);
        if (error) {
          toast(error);
          continue;
        }
        next.push(createStaged(file, kind));
      }
      return next;
    });
  }

  function removeStaged(id: string) {
    setStaged((prev) => {
      const item = prev.find((s) => s.id === id);
      if (item) revokeStaged(item);
      return prev.filter((s) => s.id !== id);
    });
  }

  function submit(e?: FormEvent) {
    e?.preventDefault();
    if (disabled) return;
    if (staged.length > 0) {
      onSendMedia(staged, value);
      setStaged([]);
      setValue("");
      return;
    }
    const text = value.trim();
    if (!text) return;
    onSend(text);
    setValue("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  const hasContent = Boolean(value.trim()) || staged.length > 0;
  const roundBtn =
    "grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-95";

  return (
    <form
      onSubmit={submit}
      className="glass flex flex-col border-t px-3 py-2.5 sm:px-4"
      style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}
    >
      <StagedTray items={staged} onRemove={removeStaged} />

      {recording ? (
        <div className="flex items-center gap-3 py-0.5">
          <button
            type="button"
            onClick={cancel}
            aria-label="Cancel recording"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-destructive"
          >
            <Trash2 className="size-4.5" />
          </button>
          <span className="size-2.5 shrink-0 animate-pulse rounded-full bg-destructive" />
          <span className="text-sm font-medium tabular-nums">{formatTime(seconds)}</span>
          <span className="flex-1 truncate text-sm text-muted-foreground">Recording voice note…</span>
          <button type="button" onClick={stop} aria-label="Send voice note" className={roundBtn}>
            <SendHorizonal className="size-4.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-end gap-2">
          <MediaMenu onStage={stage} disabled={disabled} />

          <Textarea
            rows={1}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (e.target.value) onTyping();
            }}
            onKeyDown={onKeyDown}
            placeholder="Message"
            aria-label="Message"
            className="max-h-32 min-h-9 flex-1 resize-none rounded-2xl border-transparent bg-secondary px-3.5 py-2 shadow-none"
          />

          {hasContent ? (
            <button type="submit" aria-label="Send message" disabled={disabled} className={cn(roundBtn, disabled && "pointer-events-none opacity-40")}>
              <SendHorizonal className="size-4.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={start}
              aria-label="Record voice note"
              disabled={disabled}
              className={cn(roundBtn, disabled && "pointer-events-none opacity-40")}
            >
              <Mic className="size-4.5" />
            </button>
          )}
        </div>
      )}
    </form>
  );
}
