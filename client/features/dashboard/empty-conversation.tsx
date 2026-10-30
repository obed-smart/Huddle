import { MessagesSquare } from "lucide-react";

/** Right-pane resting state (desktop) when no conversation is open. */
export function EmptyConversation() {
  return (
    <div className="hidden flex-1 flex-col items-center justify-center gap-3 bg-secondary/40 p-8 text-center md:flex">
      <span className="grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
        <MessagesSquare className="size-7" />
      </span>
      <h2 className="font-display text-lg font-semibold">Pick a conversation</h2>
      <p className="max-w-xs text-sm text-muted-foreground">
        Choose someone on the left to see your messages here.
      </p>
    </div>
  );
}
