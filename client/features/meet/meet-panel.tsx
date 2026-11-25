"use client";

import { useState } from "react";
import { Mic, MicOff, Video, VideoOff, X, SendHorizonal } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { useMeet } from "./meet-store";
import type { MeetTileModel } from "./meet-tile";

type Msg = { id: string; by: string; text: string; me: boolean };

/** The right-hand panel: the participant list or the meeting chat. A column
    beside the stage on desktop, a slide-up sheet on a phone. Chat is local for
    now; it moves onto the meet channel when signaling lands. */
export function MeetPanel({ tiles }: { tiles: MeetTileModel[] }) {
  const panel = useMeet((s) => s.panel);
  const setPanel = useMeet((s) => s.setPanel);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");

  function send() {
    const text = draft.trim();
    if (!text) return;
    setMessages((m) => [...m, { id: `${Date.now()}`, by: "You", text, me: true }]);
    setDraft("");
  }

  return (
    <aside className="flex w-full flex-col border-border bg-popover md:w-80 md:border-l">
      <header className="flex items-center justify-between border-b px-2 py-2">
        <div className="flex gap-1">
          {(["people", "chat"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setPanel(t)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize ${panel === t ? "bg-secondary text-foreground" : "text-muted-foreground"}`}
            >
              {t === "people" ? `People (${tiles.length})` : "Chat"}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setPanel("none")} aria-label="Close panel" className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary">
          <X className="size-4" />
        </button>
      </header>

      {panel === "people" ? (
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {tiles.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-xl px-2 py-2">
              <Avatar src={t.avatar} name={t.name} className="size-9" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.isLocal ? `${t.name} (You)` : t.name}</span>
              {t.micOn ? <Mic className="size-4 text-muted-foreground" /> : <MicOff className="size-4 text-red-500" />}
              {t.camOn ? <Video className="size-4 text-muted-foreground" /> : <VideoOff className="size-4 text-red-500" />}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
            {messages.length ? (
              messages.map((m) => (
                <div key={m.id} className="text-sm">
                  <span className="font-semibold">{m.by}</span>
                  <p className="text-foreground/90">{m.text}</p>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No messages yet.</p>
            )}
          </div>
          <div className="flex items-center gap-2 border-t p-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Send a message"
              className="min-w-0 flex-1 rounded-full bg-secondary px-4 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button type="button" onClick={send} aria-label="Send" className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
              <SendHorizonal className="size-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
