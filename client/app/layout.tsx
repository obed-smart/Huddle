import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SocketProvider } from "@/features/realtime/socket-provider";
import { CallController } from "@/features/call/call-controller";
import { CallRoot } from "@/features/call/call-root";

export const metadata: Metadata = {
  title: "Huddle — chat, call, and meet",
  description:
    "Huddle is one place to message your people, hop on a call, and run a meeting. A demo client for the Huddle real-time backend.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // The per-request CSP nonce (set by middleware) so next-themes can tag its
  // anti-flash inline script; without it the strict CSP would block the script.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
          nonce={nonce}
        >
          <SocketProvider>
            <CallController />
            {children}
          </SocketProvider>
          <CallRoot />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
