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
