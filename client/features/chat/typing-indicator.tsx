/** Three soft dots plus the "typing…" label, shown at the foot of the list. */
export function TypingIndicator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-1 py-1 text-xs text-muted-foreground">
      <span className="flex items-center gap-1" aria-hidden>
        <Dot delay="0ms" />
        <Dot delay="150ms" />
        <Dot delay="300ms" />
      </span>
      <span>{label}</span>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 motion-reduce:animate-none"
      style={{ animationDelay: delay, animationDuration: "1s" }}
    />
  );
}
