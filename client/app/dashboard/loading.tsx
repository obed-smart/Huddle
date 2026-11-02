import { Skeleton } from "@/components/ui/skeleton";

/** Shown while the dashboard route segment loads. Mirrors the shell so the
    layout doesn't jump when the real content arrives. */
export default function DashboardLoading() {
  return (
    <div className="flex h-dvh overflow-hidden">
      <div className="hidden w-16 flex-col items-center gap-4 border-r bg-background py-4 md:flex">
        <Skeleton className="size-9 rounded-xl" />
        <Skeleton className="size-9 rounded-xl" />
        <Skeleton className="size-9 rounded-xl" />
      </div>

      <div className="flex w-full flex-col gap-3 border-r bg-background p-4 md:w-[360px]">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-11 w-full rounded-md" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 py-1">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden flex-1 bg-secondary/40 md:block" />
    </div>
  );
}
