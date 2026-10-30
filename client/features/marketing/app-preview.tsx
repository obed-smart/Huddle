import { Phone, Video, SendHorizontal } from "lucide-react";

type Line = { from: "them" | "me"; text: string; time: string };

const lines: Line[] = [
  { from: "them", text: "Are we still on for the kickoff at 4?", time: "9:17" },
  { from: "me", text: "Yep — I'll start the room a few minutes early.", time: "9:18" },
  { from: "them", text: "Perfect. Sending the notes over now.", time: "9:19" },
];

/** A quiet chat-window mockup for the hero. Pure markup, one color. */
export function AppPreview() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-lg">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span className="grid size-9 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
          DH
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">Design Hackathon</p>
          <p className="text-xs text-muted-foreground">3 people · online</p>
        </div>
        <Phone className="size-[18px] text-muted-foreground" />
        <Video className="size-[18px] text-muted-foreground" />
      </header>

      <div className="flex flex-col gap-2.5 bg-secondary/60 px-4 py-5">
        {lines.map((line, i) =>
          line.from === "them" ? (
            <div key={i} className="max-w-[78%] self-start">
              <div className="rounded-2xl rounded-bl-md bg-card px-3.5 py-2 text-sm shadow-sm">
                {line.text}
              </div>
              <span className="mt-1 block text-[11px] text-muted-foreground">
                {line.time}
              </span>
            </div>
          ) : (
            <div key={i} className="max-w-[78%] self-end text-right">
              <div className="rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-left text-sm text-primary-foreground">
                {line.text}
              </div>
              <span className="mt-1 block text-[11px] text-muted-foreground">
                {line.time}
              </span>
            </div>
          ),
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-border px-3 py-3">
        <div className="flex-1 rounded-full bg-secondary px-4 py-2 text-sm text-muted-foreground">
          Message
        </div>
        <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
          <SendHorizontal className="size-4" />
        </span>
      </div>
    </div>
  );
}
