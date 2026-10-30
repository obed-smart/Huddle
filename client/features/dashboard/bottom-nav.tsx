"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { toast } from "@/lib/notify";
import { navItems, type NavItem } from "./nav-items";

/** Mobile bottom tab bar. */
export function BottomNav({ className }: { className?: string }) {
  const pathname = usePathname();

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
    </nav>
  );
}

function BottomItem({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  const base =
    "flex flex-1 flex-col items-center gap-1 rounded-lg py-1 text-[10px] font-medium transition-colors active:scale-95";

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
