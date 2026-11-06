"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Users, CheckCircle2 } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Logo } from "@/features/marketing/logo";
import { toast } from "@/lib/notify";
import { ApiError } from "@/lib/api/http";
import { fetchInvite, joinByInvite, type InvitePreview } from "@/lib/api/group";

type Phase = "loading" | "ready" | "notfound" | "error";

/** The screen a `/join/<code>` link lands on: it previews the group, then joins
    (public) or sends a join request (private). Not signed in goes to login. */
export function JoinView({ code }: { code: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [joining, setJoining] = useState(false);
  const [requested, setRequested] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchInvite(code)
      .then((data) => {
        if (!cancelled) {
          setInvite(data);
          setPhase("ready");
        }
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 401) {
          router.replace(`/login?next=${encodeURIComponent(`/join/${code}`)}`);
          return;
        }
        setPhase(e instanceof ApiError && e.status === 404 ? "notfound" : "error");
      });
    return () => {
      cancelled = true;
    };
  }, [code, router]);

  async function join() {
    if (joining) return;
    setJoining(true);
    try {
      const result = await joinByInvite(code);
      if (typeof result === "string" && /request/i.test(result)) {
        setRequested(result);
        return;
      }
      toast("You joined the group.");
      router.replace("/dashboard");
    } catch (e) {
      if (e instanceof ApiError && /member/i.test(e.message)) {
        router.replace("/dashboard");
        return;
      }
      toast(e instanceof ApiError ? e.message : "Could not join right now.");
      setJoining(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-secondary px-6 py-10 text-center">
      <Logo />

      {phase === "loading" ? (
        <Loader2 className="size-7 animate-spin text-muted-foreground" />
      ) : phase === "notfound" || phase === "error" ? (
        <Panel
          title={phase === "notfound" ? "Invite not found" : "Something went wrong"}
          subtitle={
            phase === "notfound"
              ? "This invite link is invalid or has expired."
              : "Could not load this invite. Try again shortly."
          }
        />
      ) : requested ? (
        <Panel icon={<CheckCircle2 className="size-10 text-primary" />} title="Request sent" subtitle={requested} cta />
      ) : invite ? (
        <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border bg-background p-6 shadow-sm">
          <Avatar src={invite.avatar ?? null} name={invite.name ?? "Group"} className="size-20 text-2xl" />
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">You are invited to join</p>
            <h1 className="font-display text-xl font-bold">{invite.name ?? "a group"}</h1>
            {typeof invite.membersCount === "number" ? (
              <p className="inline-flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <Users className="size-3.5" /> {invite.membersCount} members
              </p>
            ) : null}
          </div>
          {invite.description ? (
            <p className="max-w-xs whitespace-pre-wrap text-sm text-muted-foreground">{invite.description}</p>
          ) : null}
          <Button size="lg" className="w-full" onClick={join} disabled={joining}>
            {joining ? <Loader2 className="size-4 animate-spin" /> : null}
            {invite.visibility === "private" ? "Request to join" : "Join group"}
          </Button>
          <Link href="/dashboard" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Not now
          </Link>
        </div>
      ) : null}
    </main>
  );
}

function Panel({
  icon,
  title,
  subtitle,
  cta,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle: string;
  cta?: boolean;
}) {
  return (
    <div className="flex max-w-sm flex-col items-center gap-3 text-center">
      {icon}
      <h1 className="font-display text-2xl font-bold">{title}</h1>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
      <Link
        href={cta ? "/dashboard" : "/"}
        className="mt-2 grid h-11 place-items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.99]"
      >
        {cta ? "Go to Huddle" : "Back to home"}
      </Link>
    </div>
  );
}
