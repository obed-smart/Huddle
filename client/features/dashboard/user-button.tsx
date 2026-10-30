"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useSession } from "@/stores/session";

/** Avatar that opens a small account menu (name + sign out). */
export function UserButton({
  menuSide = "right",
}: {
  menuSide?: "right" | "bottom";
}) {
  const router = useRouter();
  const user = useSession((s) => s.user);
  const signOut = useSession((s) => s.signOut);
  const [open, setOpen] = useState(false);

  if (!user) return null;
  const name = user.displayName || user.username;

  async function onSignOut() {
    setOpen(false);
    await signOut();
    router.replace("/login");
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Account"
        onClick={() => setOpen((o) => !o)}
        className="rounded-full outline-none transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Avatar src={user.avatarUrl} name={name} className="size-9" />
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className={cn(
              "absolute z-50 w-52 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg",
              menuSide === "right"
                ? "bottom-0 left-full ml-2"
                : "right-0 top-full mt-2",
            )}
          >
            <div className="px-3 py-2">
              <p className="truncate text-sm font-semibold">{name}</p>
              <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
