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
};

/** A light segmented control — no heavy tabs primitive. */
export function ConversationTabs({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-secondary p-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={cn(
            "flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            value === tab.key
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
