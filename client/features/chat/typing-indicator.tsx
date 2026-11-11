/** The "someone is typing" cue: three soft dots bouncing inside an incoming
    style bubble. No words, just the bubble. The label is kept for screen
    readers only, so a group still announces who is typing. */
export function TypingIndicator({ label }: { label: string }) {
  return (
    <div className="flex" role="status" aria-label={label}>
      <span
        className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-secondary px-3.5 py-3"
        aria-hidden
      >
        <Dot delay="0ms" />
        <Dot delay="150ms" />
        <Dot delay="300ms" />
      </span>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="size-2 animate-bounce rounded-full bg-muted-foreground/60 motion-reduce:animate-none"
      style={{ animationDelay: delay, animationDuration: "1s" }}
    />
  );
}
