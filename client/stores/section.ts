import { create } from "zustand";

/** Which list the sidebar shows: the chats or the call log. A plain client
    toggle (not a route), driven by the nav rail and the bottom nav. */
export type Section = "chats" | "calls";

type SectionStore = {
  section: Section;
  setSection: (section: Section) => void;
};

export const useSection = create<SectionStore>((set) => ({
  section: "chats",
  setSection: (section) => set({ section }),
}));
