import { create } from "zustand";

/** A person we might need to name: the fields any message sender could want. */
export type Person = {
  id: string;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
};

type PeopleState = {
  byId: Record<string, Person>;
  /** Merge people in, keeping fields a later, thinner record leaves out. */
  merge: (people: Person[]) => void;
};

/**
 * A shared directory of everyone the UI has learned about (the signed-in user,
 * a DM's other side, a group's participants). A message that carries only a
 * `senderId` is named by looking the id up here, so the backend never has to
 * join the user table onto every row of the timeline.
 */
export const usePeople = create<PeopleState>((set) => ({
  byId: {},
  merge: (people) =>
    set((state) => {
      const byId = { ...state.byId };
      for (const person of people) {
        if (!person.id) continue;
        byId[person.id] = { ...byId[person.id], ...person };
      }
      return { byId };
    }),
}));
