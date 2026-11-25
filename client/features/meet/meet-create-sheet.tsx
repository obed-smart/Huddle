"use client";

import { useState } from "react";
import { Zap, CalendarClock, ChevronLeft } from "lucide-react";

import { SheetModal } from "@/components/ui/sheet-modal";
import { toast } from "@/lib/notify";
import { createMeet } from "@/lib/api/meet";

type Props = {
  conversationId: string;
  open: boolean;
  onClose: () => void;
  /** An instant meeting was created: open its room. */
  onStarted: (meetId: string) => void;
};

function today() {
  const n = new Date();
  const p = (x: number) => String(x).padStart(2, "0");
  return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}`;
}
function nextHour() {
  return `${String((new Date().getHours() + 1) % 24).padStart(2, "0")}:00`;
}

/** Starting a meeting is a choice, not a dial: begin one instantly, or schedule
    it for later with a name and a time. Rises from the bottom on a phone and
    centers on desktop. */
export function MeetCreateSheet({ conversationId, open, onClose, onStarted }: Props) {
  const [step, setStep] = useState<"entry" | "schedule">("entry");
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  // Fill the pickers when the schedule step opens, not during render: a
  // time-based default computed while rendering mismatches between server and
  // client and breaks hydration.
  function openSchedule() {
    setDate(today());
    setTime(nextHour());
    setStep("schedule");
  }

  async function instant() {
    setBusy(true);
    try {
      const { meetId } = await createMeet(conversationId);
      onStarted(meetId);
    } catch {
      toast("Could not start the meeting.");
      setBusy(false);
    }
  }

  async function schedule() {
    if (!date || !time) return;
    setBusy(true);
    try {
      await createMeet(conversationId, { title: title.trim() || undefined, scheduledFor: new Date(`${date}T${time}`).toISOString() });
      toast("Meeting scheduled.");
      onClose();
    } catch {
      toast("Could not schedule the meeting.");
    } finally {
      setBusy(false);
    }
  }

  const reset = () => {
    setStep("entry");
    setBusy(false);
    setTitle("");
  };

  return (
    <SheetModal open={open} onClose={onClose} label="New meeting" onExited={reset}>
      {step === "entry" ? (
        <>
          <header className="border-b px-4 py-3">
            <p className="text-sm font-semibold">New meeting</p>
          </header>
          <div className="p-2">
            <Choice icon={<Zap className="size-5" />} title="Start an instant meeting" sub="Begin now, no title needed" onClick={instant} disabled={busy} />
            <Choice icon={<CalendarClock className="size-5" />} title="Schedule for later" sub="Pick a time and name it" onClick={openSchedule} />
          </div>
        </>
      ) : (
        <>
          <header className="flex items-center gap-2 border-b px-2 py-2">
            <button type="button" onClick={() => setStep("entry")} aria-label="Back" className="grid size-8 place-items-center rounded-full hover:bg-secondary">
              <ChevronLeft className="size-5" />
            </button>
            <p className="text-sm font-semibold">Schedule a meeting</p>
          </header>
          <div className="space-y-3 p-4">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" className="w-full rounded-xl bg-secondary px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground" />
            <div className="flex gap-2">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="min-w-0 flex-1 rounded-xl bg-secondary px-3 py-2.5 text-sm outline-none" />
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="min-w-0 flex-1 rounded-xl bg-secondary px-3 py-2.5 text-sm outline-none" />
            </div>
            <button type="button" onClick={schedule} disabled={busy || !date || !time} className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-95 disabled:opacity-50">
              Schedule
            </button>
          </div>
        </>
      )}
    </SheetModal>
  );
}

function Choice({ icon, title, sub, onClick, disabled = false }: { icon: React.ReactNode; title: string; sub: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-secondary disabled:opacity-50">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{sub}</span>
      </span>
    </button>
  );
}
