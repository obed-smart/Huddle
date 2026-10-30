import Link from "next/link";

import { Logo } from "@/components/landing/logo";
import { routes } from "@/components/landing/content";

/** A small, honest footer. */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 px-4 py-10 text-center sm:flex-row sm:px-6 sm:text-left">
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <Logo />
          <p className="text-sm text-muted-foreground">
            A demo client for the Huddle real-time backend.
          </p>
        </div>

        <nav className="flex items-center gap-5 text-sm">
          <Link
            href={routes.login}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            href={routes.register}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Create account
          </Link>
        </nav>
      </div>
      <p className="pb-8 text-center text-xs text-muted-foreground">
        © {year} Huddle
      </p>
    </footer>
  );
}
