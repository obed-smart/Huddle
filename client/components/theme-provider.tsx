"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Class-based theme (.dark on <html>), persisted, no flash on load. */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
