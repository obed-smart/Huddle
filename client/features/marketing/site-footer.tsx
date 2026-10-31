import Link from "next/link";

import { Logo } from "@/features/marketing/logo";
import { routes } from "@/features/marketing/content";

/** A small, quiet footer: one compact row. */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 text-center sm:flex-row sm:px-6 sm:text-left">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="text-xs text-muted-foreground">© {year}</span>
        </div>

        <nav className="flex items-center gap-5 text-sm text-muted-foreground">
          <Link href={routes.login} className="transition-colors hover:text-foreground">
            Sign in
          </Link>
          <Link
            href={routes.register}
            className="transition-colors hover:text-foreground"
          >
            Create account
          </Link>
        </nav>
      </div>
    </footer>
  );
}
