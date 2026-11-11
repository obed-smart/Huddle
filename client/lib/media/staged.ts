import type { ServerKind } from "./policy";
import { uid } from "@/lib/id";

/** A file chosen in the composer but not yet sent: it shows a local preview
    (object URL) and carries its server kind for the upload. */
export type StagedItem = { id: string; file: File; kind: ServerKind; url: string };

export function createStaged(file: File, kind: ServerKind): StagedItem {
  return { id: uid(), file, kind, url: URL.createObjectURL(file) };
}

export function revokeStaged(item: StagedItem) {
  try {
    URL.revokeObjectURL(item.url);
  } catch {
    // Revoking a URL that is already gone is harmless.
  }
}
