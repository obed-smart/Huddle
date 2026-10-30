import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/features/marketing/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

/** Centered auth card on the soft canvas — shared by login and register. */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <main className="relative flex min-h-screen flex-col bg-secondary">
      <ThemeToggle className="absolute right-3 top-3 sm:right-5 sm:top-5" />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6">
        <Link href="/" aria-label="Huddle home" className="mb-8">
          <Logo />
        </Link>

        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-md sm:p-8">
          <div className="flex flex-col gap-1.5 text-center">
            <h1 className="font-display text-2xl font-bold tracking-tight">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>

          <div className="mt-6 flex flex-col gap-5">{children}</div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
      </div>
    </main>
  );
}
