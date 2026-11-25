import { create } from "zustand";

/** How long a pending invite rings before it gives up and the row goes back to
    invitable, matching the ring timeout a placed call uses. */
const RING_MS = 35000;

const timers = new Map<string, ReturnType<typeof setTimeout>>();

type InvitesState = {
  /** userId -> true while we are ringing them from this call. */
  ringing: Record<string, boolean>;
  ring: (userId: string) => void;
  stop: (userId: string) => void;
  clear: () => void;
};

/** The invites we have sent from the current call and are waiting on. Kept in a
    store, not the sheet, so the ringing state survives the sheet being closed
    and reopened, and a ring that no one answers cleans itself up on a timer. */
export const useCallInvites = create<InvitesState>((set) => ({
  ringing: {},
  ring: (userId) => {
    clearTimeout(timers.get(userId));
    timers.set(userId, setTimeout(() => useCallInvites.getState().stop(userId), RING_MS));
    set((s) => ({ ringing: { ...s.ringing, [userId]: true } }));
  },
  stop: (userId) => {
    clearTimeout(timers.get(userId));
    timers.delete(userId);
    set((s) => {
      const ringing = { ...s.ringing };
      delete ringing[userId];
      return { ringing };
    });
  },
  clear: () => {
    for (const t of timers.values()) clearTimeout(t);
    timers.clear();
    set({ ringing: {} });
  },
}));
