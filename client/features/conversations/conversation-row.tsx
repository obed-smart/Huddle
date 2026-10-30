import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/lib/time";
import type { Conversation } from "@/lib/api/types";

type Props = {
  conversation: Conversation;
  unread: number;
  selected: boolean;
  onSelect: (id: string) => void;
};

export function ConversationRow({ conversation, unread, selected, onSelect }: Props) {
  const subtitle =
    conversation.type === "group"
      ? `${conversation.membersCount ?? "?"} members`
      : "Direct message";

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      aria-current={selected || undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors active:scale-[0.99]",
        selected ? "bg-accent" : "hover:bg-secondary",
      )}
    >
      <Avatar
        src={conversation.avatar}
        name={conversation.name}
        className="size-11"
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold">{conversation.name}</span>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {relativeTime(conversation.updatedAt)}
          </span>
        </span>
        <span className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "truncate text-sm",
              unread ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            {subtitle}
          </span>
          {unread > 0 ? (
            <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}
