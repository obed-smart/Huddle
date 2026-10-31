"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { SendHorizonal } from "lucide-react";

import { cn } from "@/lib/utils";
import { MediaMenu } from "./media-menu";

type Props = {
  onSend: (text: string) => void;
  onTyping: () => void;
  disabled?: boolean;
};

/** The message input: media picker, a growing text field, and send. */
export function ChatComposer({ onSend, onTyping, disabled }: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  function grow() {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }

  function submit(e?: FormEvent) {
    e?.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
    requestAnimationFrame(grow);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <form
      onSubmit={submit}
      className="glass flex items-end gap-2 border-t px-3 py-2.5 sm:px-4"
      style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}
    >
      <MediaMenu />

      <textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          grow();
          if (e.target.value) onTyping();
        }}
        onKeyDown={onKeyDown}
        placeholder="Message"
        aria-label="Message"
        className="max-h-32 min-h-9 flex-1 resize-none bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground"
      />

      <button
        type="submit"
        aria-label="Send message"
        disabled={!value.trim() || disabled}
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-all active:scale-95",
          (!value.trim() || disabled) && "pointer-events-none opacity-40",
        )}
      >
        <SendHorizonal className="size-4.5" />
      </button>
    </form>
  );
}
