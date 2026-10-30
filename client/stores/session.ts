import { create } from "zustand";

import type { AuthUser } from "@/lib/api/types";
import { fetchMe, logout as apiLogout } from "@/lib/api/auth";
import { setSessionExpiredHandler } from "@/lib/api/http";
import { connectSocket, disconnectSocket } from "@/lib/socket";

type Status = "idle" | "loading" | "authed" | "anon";

type SessionState = {
  user: AuthUser | null;
  status: Status;
  /** Ask the server who we are (and open the socket if signed in). */
  load: () => Promise<boolean>;
  signOut: () => Promise<void>;
  reset: () => void;
};

let guardInstalled = false;

export const useSession = create<SessionState>((set, get) => ({
  user: null,
  status: "idle",

  load: async () => {
    if (!guardInstalled) {
      guardInstalled = true;
      // A 401 a refresh can't fix means the session is dead — sign out.
      setSessionExpiredHandler(() => get().reset());
    }
    set({ status: "loading" });
    try {
      const user = await fetchMe();
      connectSocket();
      set({ user, status: "authed" });
      return true;
    } catch {
      set({ user: null, status: "anon" });
      return false;
    }
  },

  signOut: async () => {
    try {
      await apiLogout();
    } catch {
      // Even if the request fails, clear local state.
    }
    get().reset();
  },

  reset: () => {
    disconnectSocket();
    set({ user: null, status: "anon" });
  },
}));
