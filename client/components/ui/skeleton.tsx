import { cn } from "@/lib/utils";

/** Loading placeholder. Use instead of hand-rolled animate-pulse divs. */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}
