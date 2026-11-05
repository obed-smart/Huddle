"use client";

import { useState } from "react";
import { Check, Loader2, Pencil, X } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/notify";
import { ApiError } from "@/lib/api/http";
import { updateGroup, type GroupDetails } from "@/lib/api/group";

type Props = { groupId: string; group: GroupDetails; avatar: string | null; canEdit: boolean; onSaved: () => void };

/** The group's photo, name, and description. The pencil turns the name and
    description into bordered fields edited in place (no popup); Save writes and
    Cancel reverts. */
export function GroupIdentity({ groupId, group, avatar, canEdit, onSaved }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    const n = name.trim();
    if (!n || busy) return;
    setBusy(true);
    try {
      await updateGroup(groupId, { name: n, description: description.trim() });
      toast("Group updated.");
      setEditing(false);
      onSaved();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Could not save the changes.");
    } finally {
      setBusy(false);
    }
  }

  function cancel() {
    setName(group.name);
    setDescription(group.description ?? "");
    setEditing(false);
  }

  return (
    <div className="flex flex-col items-center gap-2 px-4 pb-4 pt-6 text-center">
      <Avatar src={avatar} name={group.name} className="size-24 text-2xl" />

      {editing ? (
        <div className="flex w-full max-w-sm flex-col gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Group name"
            placeholder="Group name"
            maxLength={100}
            className="text-center font-semibold"
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-label="Group description"
            placeholder="Add a description"
            maxLength={500}
            className="min-h-20 text-center"
          />
          <div className="flex justify-center gap-2">
            <Button variant="ghost" size="sm" onClick={cancel} disabled={busy}>
              <X className="size-4" /> Cancel
            </Button>
            <Button size="sm" onClick={save} disabled={!name.trim() || busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Save
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl font-bold">{group.name}</h2>
            {canEdit ? (
              <button
                type="button"
                aria-label="Edit group"
                onClick={() => setEditing(true)}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Pencil className="size-4" />
              </button>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">Group · {group.membersCount} members</p>
          {group.description ? (
            <p className="max-w-sm whitespace-pre-wrap text-sm text-muted-foreground">{group.description}</p>
          ) : null}
        </>
      )}
    </div>
  );
}
