import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Logo } from "@/features/marketing/logo";
import { navLinks, routes } from "@/features/marketing/content";

/** Sticky, translucent top bar: wordmark left, anchors centered, actions right. */
export function SiteHeader() {
  return (
    <header className="glass sticky top-0 z-40 border-b">
      <div className="relative mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Huddle home">
          <Logo />
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href={routes.login}>Sign in</Link>
          </Button>
          <Button asChild size="sm" className="rounded-full px-5">
            <Link href={routes.register}>Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
