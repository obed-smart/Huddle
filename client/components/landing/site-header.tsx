import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/landing/logo";
import { routes } from "@/components/landing/content";

/** Sticky top bar: wordmark left, the two auth actions right. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Huddle home">
          <Logo />
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <Button asChild variant="ghost" size="sm">
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
