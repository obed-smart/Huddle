"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SheetModal } from "@/components/ui/sheet-modal";
import { toast } from "@/lib/notify";
import { ApiError } from "@/lib/api/http";
import { updateGroup } from "@/lib/api/group";

type Props = {
  groupId: string;
  open: boolean;
  initialName: string;
  initialDescription: string;
  onClose: () => void;
  onSaved: () => void;
};

/** Edit a group's name and description (admins only). */
export function EditGroupSheet({ groupId, open, initialName, initialDescription, onClose, onSaved }: Props) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [busy, setBusy] = useState(false);

  async function save() {
    const n = name.trim();
    if (n.length < 1 || busy) return;
    setBusy(true);
    try {
      await updateGroup(groupId, { name: n, description: description.trim() });
      toast("Group updated.");
      onSaved();
      onClose();
    } catch (e) {
      setBusy(false);
      toast(e instanceof ApiError ? e.message : "Could not save the changes.");
    }
  }

  return (
    <SheetModal
      open={open}
      onClose={onClose}
      label="Edit group"
      onExited={() => {
        setName(initialName);
        setDescription(initialDescription);
        setBusy(false);
      }}
    >
      <header className="flex items-center gap-2 border-b px-3 py-2.5">
        <p className="flex-1 text-sm font-semibold">Edit group</p>
        <Button size="sm" disabled={!name.trim() || busy} onClick={save}>
          {busy ? <Loader2 className="animate-spin" /> : null}
          Save
        </Button>
      </header>
      <div className="flex flex-col gap-3 p-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Group name"
          aria-label="Group name"
          maxLength={100}
        />
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          aria-label="Group description"
          maxLength={500}
          className="min-h-24"
        />
      </div>
    </SheetModal>
  );
}
