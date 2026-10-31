"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Loader2, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { springs } from "@/lib/springs";
import { useUserSearch } from "./use-user-search";
import { UserResult } from "./user-result";

type Props = { open: boolean; onClose: () => void };

/** A focused "find people" task, presented as a modal: a dimming scrim pushes
    the list back, the panel rises and settles on a spring (a cross-fade when
    motion is reduced), centered on desktop and a bottom sheet on phones. */
export function UserSearchSheet({ open, onClose }: Props) {
  const reduce = useReducedMotion();
  const [query, setQuery] = useState("");
  const { results, status } = useUserSearch(query);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const focus = requestAnimationFrame(() => inputRef.current?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(focus);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const panel = reduce
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

  return (
    <AnimatePresence onExitComplete={() => setQuery("")}>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-4"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            transition={springs.snappy}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Find people"
            className="relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-popover shadow-xl md:max-w-md md:rounded-2xl"
            variants={panel}
            transition={springs.sheet}
          >
            <header className="flex items-center gap-2 border-b px-3 py-2.5">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by username"
                  aria-label="Search by username"
                  className="pl-9"
                />
              </div>
              <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
                <X />
              </Button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              <Body query={query} results={results} status={status} />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Body({
  query,
  results,
  status,
}: {
  query: string;
  results: ReturnType<typeof useUserSearch>["results"];
  status: ReturnType<typeof useUserSearch>["status"];
}) {
  if (status === "idle") {
    return <Hint>Search by username to start a chat.</Hint>;
  }
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Searching…
      </div>
    );
  }
  if (status === "error") {
    return <Hint>Could not search just now. Try again.</Hint>;
  }
  if (results.length === 0) {
    return <Hint>No one found for “{query.trim()}”.</Hint>;
  }
  return (
    <div className="flex flex-col">
      {results.map((user) => (
        <UserResult key={user.id} user={user} />
      ))}
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="px-2 py-10 text-center text-sm text-muted-foreground">{children}</p>;
}
