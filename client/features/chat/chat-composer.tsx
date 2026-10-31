"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { SendHorizonal } from "lucide-react";

import { cn } from "@/lib/utils";
import { toast } from "@/lib/notify";
import { Textarea } from "@/components/ui/textarea";
import { MAX_FILES, validateFile, type ServerKind } from "@/lib/media/policy";
import { createStaged, revokeStaged, type StagedItem } from "@/lib/media/staged";
import { MediaMenu } from "./media-menu";
import { StagedTray } from "./staged-tray";

type Props = {
  onSend: (text: string) => void;
  onSendMedia: (items: StagedItem[], caption: string) => void;
  onTyping: () => void;
  disabled?: boolean;
};

/** The message input: media picker, a staged-file tray, a growing text field,
    and send. Files are validated against the policy before they can be sent. */
export function ChatComposer({ onSend, onSendMedia, onTyping, disabled }: Props) {
  const [value, setValue] = useState("");
  const [staged, setStaged] = useState<StagedItem[]>([]);

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
      // The optimistic bubble reuses the staged object URLs, so they are not
      // revoked here; the server echo swaps in the stored attachments.
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

  const canSend = !disabled && (Boolean(value.trim()) || staged.length > 0);

  return (
    <form
      onSubmit={submit}
      className="glass flex flex-col border-t px-3 py-2.5 sm:px-4"
      style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}
    >
      <StagedTray items={staged} onRemove={removeStaged} />

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

        <button
          type="submit"
          aria-label="Send message"
          disabled={!canSend}
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-all active:scale-95",
            !canSend && "pointer-events-none opacity-40",
          )}
        >
          <SendHorizonal className="size-4.5" />
        </button>
      </div>
    </form>
  );
}
