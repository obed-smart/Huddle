"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Link2, LogOut, Pencil, UserPlus, X } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { springs } from "@/lib/springs";
import { toast } from "@/lib/notify";
import { ApiError } from "@/lib/api/http";
import { generateInviteCode, leaveGroup, type GroupMember } from "@/lib/api/group";
import type { Conversation } from "@/lib/api/types";
import { useSession } from "@/stores/session";
import { useConversations } from "@/stores/conversations";
import { useGroupInfo } from "./use-group-info";
import { InfoAction } from "./info-action";
import { MemberRow } from "./member-row";
import { MemberActionsSheet } from "./member-actions-sheet";
import { AddMembersSheet } from "./add-members-sheet";
import { EditGroupSheet } from "./edit-group-sheet";
import { JoinRequestsSection } from "./join-requests-section";

type Props = { conversation: Conversation; open: boolean; onClose: () => void };

/** The group's inner settings, opened from the chat header. Right-docked panel
    on desktop (dim scrim), full screen on phones, sliding from the side. */
export function GroupInfo({ conversation, open, onClose }: Props) {
  const reduce = useReducedMotion();
  const myId = useSession((s) => s.user?.id);
  const refresh = useConversations((s) => s.refresh);
  const { group, error, reload, isAdmin } = useGroupInfo(conversation.id, open);

  const [activeMember, setActiveMember] = useState<GroupMember | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
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

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <AnimatePresence>
        {open ? (
          <motion.div className="fixed inset-0 z-50 flex justify-end" initial="hidden" animate="visible" exit="hidden">
          <motion.div
            className="absolute inset-0 hidden bg-foreground/30 backdrop-blur-sm md:block"
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            transition={springs.snappy}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-label="Group info"
            className="relative flex h-full w-full flex-col bg-background md:max-w-[420px] md:border-l"
            initial={{ x: reduce ? 0 : "100%", opacity: reduce ? 0 : 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: reduce ? 0 : "100%", opacity: reduce ? 0 : 1 }}
            transition={springs.sheet}
          >
            <header className="glass flex items-center gap-2 border-b px-3 py-3">
              <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
                <X />
              </Button>
              <p className="text-base font-semibold">Group info</p>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {!group && !error ? (
                <div className="flex flex-col items-center gap-3 p-6">
                  <Skeleton className="size-24 rounded-full" />
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-56" />
                </div>
              ) : error || !group ? (
                <p className="p-8 text-center text-sm text-muted-foreground">
                  Couldn’t load this group right now.
                </p>
              ) : (
                <>
                  <div className="flex flex-col items-center gap-2 px-4 pb-4 pt-6 text-center">
                    <Avatar src={group.avatarUrl ?? conversation.avatar} name={group.name} className="size-24 text-2xl" />
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-xl font-bold">{group.name}</h2>
                      {isAdmin ? (
                        <button type="button" aria-label="Edit group" onClick={() => setEditOpen(true)} className="text-muted-foreground hover:text-foreground">
                          <Pencil className="size-4" />
                        </button>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">Group · {group.membersCount} members</p>
                    {group.description ? (
                      <p className="max-w-sm whitespace-pre-wrap text-sm text-muted-foreground">{group.description}</p>
                    ) : null}
                  </div>

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
            </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <MemberActionsSheet
        groupId={conversation.id}
        member={activeMember}
        canManage={isAdmin}
        onClose={() => setActiveMember(null)}
        onChanged={reload}
      />
      <AddMembersSheet groupId={conversation.id} open={addOpen} onClose={() => setAddOpen(false)} onAdded={reload} />
      <EditGroupSheet
        groupId={conversation.id}
        open={editOpen}
        initialName={group?.name ?? ""}
        initialDescription={group?.description ?? ""}
        onClose={() => setEditOpen(false)}
        onSaved={reload}
      />
    </>,
    document.body,
  );
}
