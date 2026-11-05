"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { springs } from "@/lib/springs";

/**
 * The shell shared by the contact and group info panels. On a large screen it
 * is a third column beside the chat (no scrim, no blur over the conversation);
 * on a phone it covers the screen. It slides in and out, and the chat view owns
 * its presence, so this is just the panel itself.
 */
export function InfoShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.aside
      role="dialog"
      aria-label={title}
      className="fixed inset-0 z-40 flex w-full flex-col bg-background lg:static lg:z-auto lg:w-[360px] lg:shrink-0 lg:border-l"
      initial={{ x: reduce ? 0 : "100%", opacity: reduce ? 0 : 1 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: reduce ? 0 : "100%", opacity: reduce ? 0 : 1 }}
      transition={springs.sheet}
    >
      <header className="glass flex items-center gap-2 border-b px-3 py-3">
        <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
          <X />
        </Button>
        <p className="text-base font-semibold">{title}</p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </motion.aside>
  );
}
