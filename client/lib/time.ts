/** "Today, 2:26 pm" / "Yesterday, 5:21 pm" / "17 September, 7:49 pm". Matched
    against calendar days, so a call just after midnight reads as "Today". */
export function callWhen(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const daysAgo = Math.round((startOf(new Date()) - startOf(date)) / 86_400_000);
  const time = date
    .toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    .replace(/AM|PM/i, (m) => m.toLowerCase());
  if (daysAgo === 0) return `Today, ${time}`;
  if (daysAgo === 1) return `Yesterday, ${time}`;
  return `${date.toLocaleDateString([], { day: "numeric", month: "long" })}, ${time}`;
}

/** Compact relative time: "now", "5m", "3h", "2d", else a short date. */
export function relativeTime(value?: string | null): string {
  if (!value) return "";
  const then = Date.parse(value);
  if (!Number.isFinite(then)) return "";

  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 45) return "now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;

  return new Date(then).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
