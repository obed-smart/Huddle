"use client";

import { useState } from "react";
import { Link2, LogOut, UserPlus } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/lib/notify";
import { ApiError } from "@/lib/api/http";
import { generateInviteCode, leaveGroup, type GroupMember } from "@/lib/api/group";
import type { Conversation } from "@/lib/api/types";
import { useSession } from "@/stores/session";
import { useConversations } from "@/stores/conversations";
import { InfoShell } from "@/features/chat/info-shell";
import { useGroupInfo } from "./use-group-info";
import { GroupIdentity } from "./group-identity";
import { InfoAction } from "./info-action";
import { MemberRow } from "./member-row";
import { MemberActionsSheet } from "./member-actions-sheet";
import { AddMembersSheet } from "./add-members-sheet";
import { JoinRequestsSection } from "./join-requests-section";

type Props = { conversation: Conversation; onClose: () => void };

/** The group's inner settings. A third column beside the chat on a large screen
    (no scrim over the conversation), full screen on a phone. Name and
    description are edited inline, not in a popup. */
export function GroupInfo({ conversation, onClose }: Props) {
  const myId = useSession((s) => s.user?.id);
  const refresh = useConversations((s) => s.refresh);
  const { group, error, reload, isAdmin } = useGroupInfo(conversation.id, true);

  const [activeMember, setActiveMember] = useState<GroupMember | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  async function copyInviteLink() {
    try {
      const code = await generateInviteCode(conversation.id);
      if (!code) return toast("Could not create an invite link.");
      const link = `${window.location.origin}/join/${code}`;
      try {
        await navigator.clipboard.writeText(link);
        toast("Invite link copied.");
      } catch {
        toast(`Invite code: ${code}`);
      }
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Could not create an invite link.");
    }
  }

  async function leave() {
    if (leaving) return;
    setLeaving(true);
    try {
      await leaveGroup(conversation.id);
      toast("You left the group.");
      await refresh();
      onClose();
    } catch (e) {
      setLeaving(false);
      toast(e instanceof ApiError ? e.message : "Could not leave the group.");
    }
  }

  return (
    <>
      <InfoShell title="Group info" onClose={onClose}>
        {!group && !error ? (
          <div className="flex flex-col items-center gap-3 p-6">
            <Skeleton className="size-24 rounded-full" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        ) : error || !group ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Couldn’t load this group right now.</p>
        ) : (
          <>
            <GroupIdentity
              groupId={conversation.id}
              group={group}
              avatar={group.avatarUrl ?? conversation.avatar ?? null}
              canEdit={isAdmin}
              onSaved={reload}
            />

            <div className="flex items-center justify-center gap-6 border-y px-4 py-3">
              {isAdmin ? <InfoAction icon={<UserPlus />} label="Add" onClick={() => setAddOpen(true)} /> : null}
              {isAdmin ? <InfoAction icon={<Link2 />} label="Invite link" onClick={copyInviteLink} /> : null}
              <InfoAction icon={<LogOut />} label="Leave" destructive disabled={leaving} onClick={leave} />
            </div>

            {isAdmin ? <JoinRequestsSection groupId={conversation.id} onApproved={reload} /> : null}

            <section className="px-2 py-2">
              <h3 className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.participants.length} members
              </h3>
              {group.participants.map((m) => (
                <MemberRow
                  key={m.id}
                  member={m}
                  isMe={m.id === myId}
                  onOpen={isAdmin && m.id !== myId ? () => setActiveMember(m) : undefined}
                />
              ))}
            </section>
          </>
        )}
      </InfoShell>

      <MemberActionsSheet
        groupId={conversation.id}
        member={activeMember}
        canManage={isAdmin}
        onClose={() => setActiveMember(null)}
        onChanged={reload}
      />
      <AddMembersSheet groupId={conversation.id} open={addOpen} onClose={() => setAddOpen(false)} onAdded={reload} />
    </>
  );
}
