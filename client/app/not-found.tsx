import Link from "next/link";

import { Logo } from "@/features/marketing/logo";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-secondary px-6 text-center">
      <Logo />
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-bold">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          The page you’re after doesn’t exist or has moved.
        </p>
      </div>
      <Link
        href="/"
        className="grid h-11 place-items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-transform active:scale-[0.99]"
      >
        Back to home
      </Link>
    </main>
  );
}
