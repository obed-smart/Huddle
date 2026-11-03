import Link from "next/link";

import { Logo } from "@/features/marketing/logo";
import { navLinks, routes } from "@/features/marketing/content";

/** A quiet footer: brand and the honest demo note, with a compact link row. */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            A demo client for the Huddle real time backend. Chat, call, and meet
            in one place.
          </p>
        </div>

        <nav className="flex items-center gap-5 text-sm text-muted-foreground">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
          <Link href={routes.login} className="transition-colors hover:text-foreground">
            Sign in
          </Link>
          <Link href={routes.register} className="transition-colors hover:text-foreground">
            Create account
          </Link>
        </nav>
      </div>

      <div className="border-t border-border">
        <p className="mx-auto w-full max-w-6xl px-4 py-5 text-xs text-muted-foreground sm:px-6">
          © {year} Huddle
        </p>
      </div>
    </footer>
  );
}
