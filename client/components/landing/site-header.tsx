import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Logo } from "@/components/landing/logo";
import { routes } from "@/components/landing/content";

/** Sticky, translucent top bar: wordmark left, theme + auth actions right. */
export function SiteHeader() {
  return (
    <header className="glass sticky top-0 z-40 border-b">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Huddle home">
          <Logo />
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href={routes.login}>Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={routes.register}>Create account</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
