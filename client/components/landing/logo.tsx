import { cn } from "@/lib/utils";

/** The Huddle wordmark: a soft brand tile with a chat-bubble cutout + the name. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden
        className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none">
          <path
            d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H10l-4 3.5V15H7.5A2.5 2.5 0 0 1 5 12.5v-6Z"
            fill="currentColor"
          />
        </svg>
      </span>
      <span className="font-display text-lg font-bold tracking-tight">
        Huddle
      </span>
    </span>
  );
}
