"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { toast } from "@/lib/notify";
import { LogoMark } from "@/features/marketing/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UserButton } from "./user-button";
import { navItems, type NavItem } from "./nav-items";

/** Desktop vertical nav rail. */
export function NavRail({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "h-full w-16 flex-col items-center gap-1 border-r bg-background py-4",
        className,
      )}
    >
      <Link href="/dashboard" aria-label="Huddle home" className="mb-3">
        <LogoMark />
      </Link>

      {navItems.map((item) => (
        <RailItem
          key={item.key}
          item={item}
          active={item.enabled && pathname === item.href}
        />
      ))}

      <div className="mt-auto flex flex-col items-center gap-1">
        <ThemeToggle />
        <UserButton />
      </div>
    </nav>
  );
}

function RailItem({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  const base =
    "flex w-14 flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-medium transition-colors active:scale-95";

  if (item.enabled && item.href) {
    return (
      <Link
        href={item.href}
        className={cn(
          base,
          active
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
        )}
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
      className={cn(base, "text-muted-foreground/50 hover:text-muted-foreground")}
    >
      <Icon className="size-5" />
      {item.label}
    </button>
  );
}
