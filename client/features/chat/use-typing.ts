"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { emitWithAck, getSocket } from "@/lib/socket";
import { conversationIdOf } from "@/lib/messages/normalize";
import { useSession } from "@/stores/session";

/* The event names a server might use for "someone is typing". */
const TYPING_EVENTS = ["typing:update", "typing", "user:typing", "typing:start"];
/* Safety net for a stop that never arrives; must exceed the server's own. */
const EXPIRY_MS = 6000;
/* How often a keystroke re-announces typing to the server. */
const THROTTLE_MS = 1500;

type Typist = { name: string; action: string };

function buildLabel(list: Typist[], isGroup: boolean): string | null {
  if (list.length === 0) return null;
  const allRecording = list.every((t) => t.action === "recording");
  const verb = (plural: boolean) =>
    allRecording ? (plural ? "recording voice notes" : "recording a voice note") : "typing";

  if (!isGroup) return `${verb(false)}…`;
  if (list.length === 1) return `${list[0].name} is ${verb(false)}…`;
  if (list.length === 2) return `${list[0].name} and ${list[1].name} are ${verb(true)}…`;
  return `several people are ${verb(true)}…`;
}

/** Who is typing in this conversation (with expiry), plus a throttled `ping`
    to tell the server the current user is typing. */
export function useTyping(conversationId: string, isGroup: boolean) {
  const user = useSession((s) => s.user);
  const [typists, setTypists] = useState<Record<string, Typist>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const lastEmit = useRef(0);

  const stop = useCallback((key: string) => {
    const t = timers.current[key];
    if (t) clearTimeout(t);
    delete timers.current[key];
    setTypists((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const note = useCallback(
    (key: string, name: string, action: string) => {
      if (timers.current[key]) clearTimeout(timers.current[key]);
      timers.current[key] = setTimeout(() => stop(key), EXPIRY_MS);
      setTypists((prev) => ({
        ...prev,
        [key]: {
          name: name || prev[key]?.name || "Someone",
          action: action || prev[key]?.action || "typing",
        },
      }));
    },
    [stop],
  );

  // Drop every pending expiry timer when the chat unmounts (one chat per
  // mount: the view is keyed by conversation, so state starts clean).
  useEffect(() => {
    const live = timers.current;
    return () => {
      for (const id of Object.keys(live)) clearTimeout(live[id]);
    };
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (payload: Record<string, unknown>) => {
      if (conversationIdOf(payload) !== conversationId) return;
      const uid = (payload.userId ?? payload.senderId ?? payload.from) as string | undefined;
      if (uid && user && uid === user.id) return; // never show your own typing
      const isTyping = (payload.isTyping ?? payload.typing ?? true) as boolean;
      const key = uid || "someone";
      if (isTyping === false) stop(key);
      else note(key, (payload.username as string) || (payload.name as string), (payload.action as string) || "typing");
    };
    for (const e of TYPING_EVENTS) socket.on(e, handler);
    return () => {
      for (const e of TYPING_EVENTS) socket.off(e, handler);
    };
  }, [conversationId, user, note, stop]);

  const ping = useCallback(
    (action: "typing" | "recording" = "typing") => {
      const now = Date.now();
      if (now - lastEmit.current < THROTTLE_MS) return;
      lastEmit.current = now;
      emitWithAck("typing:start", { conversationId, action });
    },
    [conversationId],
  );

  return { label: buildLabel(Object.values(typists), isGroup), ping };
}
