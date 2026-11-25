import { ensureGroup } from "@/stores/groups";
import { useCallParticipants } from "./call-participants";
import { useCallInvites } from "./call-invites";
import { useCallStreams } from "./call-streams";
import type { ParticipantLeftEvt, RosterEvt } from "./signaling/types";

/** The conversation we have already pulled member names for, so a busy call
    with many roster updates fetches the group once, not on every join. */
let namedConversation: string | null = null;

/** Keep the participant store in step with a roster the backend sent. A fresh
    joiner never receives a roster listing who is already there (the backend
    sends it to everyone else), so we also pull the conversation's members once
    and use them to fill in names the roster has not reached us with yet. */
export function syncParticipants(d: RosterEvt) {
  useCallParticipants.getState().applyRoster(d.participants);
  if (namedConversation === d.conversationId) return;
  namedConversation = d.conversationId;
  void ensureGroup(d.conversationId)
    .then((g) =>
      useCallParticipants.getState().addNames(
        g.participants.map((m) => ({
          id: m.id,
          name: m.displayName || m.username,
          avatar: m.avatarUrl ?? null,
        })),
      ),
    )
    .catch(() => {
      namedConversation = null;
    });
}

/** Someone left a call that is still going. Refresh the roster from the
    authoritative remaining list and drop the leaver's tiles, so they stop
    showing on every other device, not only ours. */
export function participantLeft(d: ParticipantLeftEvt, conversationId: string) {
  syncParticipants({ callId: d.callId, conversationId, participants: d.participants });
  for (const kind of ["cam", "mic", "screen"]) useCallStreams.getState().removeRemote(d.from, kind);
}

export function clearParticipants() {
  namedConversation = null;
  useCallParticipants.getState().clear();
  useCallInvites.getState().clear();
}
