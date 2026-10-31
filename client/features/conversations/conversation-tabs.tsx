import { cn } from "@/lib/utils";

export type ConversationFilter = "all" | "unread" | "groups";

const tabs: { key: ConversationFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "groups", label: "Groups" },
];

type Props = {
  value: ConversationFilter;
  onChange: (value: ConversationFilter) => void;
  /** How many conversations are unread, shown as a badge on the Unread tab. */
  unreadCount?: number;
};

/** A light segmented control. No heavy tabs primitive. */
export function ConversationTabs({ value, onChange, unreadCount = 0 }: Props) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-secondary p-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            value === tab.key
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
          {tab.key === "unread" && unreadCount > 0 ? (
            <span className="grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
