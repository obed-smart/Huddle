"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { toast } from "@/lib/notify";
import { Avatar } from "@/components/ui/avatar";
import { useSession } from "@/stores/session";
import { UserButton } from "./user-button";
import { navItems, type NavItem } from "./nav-items";

const itemClass =
  "flex w-full flex-col items-center gap-1 rounded-lg py-1 text-[10px] font-medium transition-colors active:scale-95";

/** Mobile bottom tab bar: Chats, Calls, Meet, and You (account). */
export function BottomNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const user = useSession((s) => s.user);
  const name = user?.displayName || user?.username || "";

  return (
    <nav
      className={cn(
        "glass fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t px-2 pt-2",
        className,
      )}
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      {navItems.map((item) => (
        <BottomItem
          key={item.key}
          item={item}
          active={item.enabled && pathname === item.href}
        />
      ))}

      <UserButton
        menuSide="top"
        className="flex-1"
        triggerClassName={cn(itemClass, "text-muted-foreground")}
        trigger={
          <>
            <Avatar src={user?.avatarUrl} name={name} className="size-6" />
            You
          </>
        }
      />
    </nav>
  );
}

function BottomItem({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  const base = cn("flex-1", itemClass);

  if (item.enabled && item.href) {
    return (
      <Link
        href={item.href}
        className={cn(base, active ? "text-primary" : "text-muted-foreground")}
      >
        <Icon className="size-5" />
        {item.label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toast(`${item.label} is coming soon.`)}
      className={cn(base, "text-muted-foreground/50")}
    >
      <Icon className="size-5" />
      {item.label}
    </button>
  );
}
