"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import type { AuthUser, Conversation } from "@/lib/contracts";
import { useSession } from "@/stores/session";
import { useConversations } from "@/stores/conversations";
import { LogoMark } from "@/features/marketing/logo";

type Props = {
  user: AuthUser | null;
  conversations: Conversation[];
  children: ReactNode;
};

/**
 * Bridges the server render into the client stores. When the server already
 * resolved the session, the first paint has the user and the conversation list,
 * so there is no guard flicker and no client fetch. When it could not (an
 * expired access token, say), the client takes over: it loads the session,
 * which can refresh the token, and bounces a truly anonymous visitor to login.
 */
export function DashboardGate({ user, conversations, children }: Props) {
  const router = useRouter();
  const status = useSession((s) => s.status);
  const load = useSession((s) => s.load);

  // Seed the list once, during the first render (nothing above subscribes to
  // this store), so it is on screen at first paint instead of a commit later.
  useState(() => {
    if (user) useConversations.getState().hydrate(conversations);
  });

  // Adopt the server session after mount so the socket provider, which watches
  // session status, reacts in an effect rather than during this render.
  useEffect(() => {
    if (user) useSession.getState().hydrate(user);
    else if (status === "idle") load();
  }, [user, status, load]);

  useEffect(() => {
    if (!user && status === "anon") router.replace("/login");
  }, [user, status, router]);

  if (!user && status !== "authed") {
    return (
      <div className="flex h-dvh items-center justify-center">
        <LogoMark className="size-10 animate-pulse" />
      </div>
    );
  }

  return <>{children}</>;
}
