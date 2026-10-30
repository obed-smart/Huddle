"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * One Toaster, mounted at the root. Default toasts borrow our tokens so they
 * follow light/dark; the "new message" toast is headless (see lib/notify).
 */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-right"
      offset={16}
      mobileOffset={16}
      toastOptions={{
        style: {
          background: "var(--card)",
          color: "var(--card-foreground)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
        },
      }}
      {...props}
    />
  );
}
