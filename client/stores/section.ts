import { create } from "zustand";

/** Which list the sidebar shows: the chats, the call log, or the meetings. A
    plain client toggle (not a route), driven by the nav rail and the bottom
    nav. */
export type Section = "chats" | "calls" | "meet";

type SectionStore = {
  section: Section;
  setSection: (section: Section) => void;
};

export const useSection = create<SectionStore>((set) => ({
  section: "chats",
  setSection: (section) => set({ section }),
}));
