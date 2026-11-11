import { Skeleton } from "@/components/ui/skeleton"

/** Loading shape that mirrors the dashboard: masthead, the sales band with its chart, then the lower panels. */
export function DashboardSkeleton() {
  return (
    <div className="grid gap-10" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid gap-5">
        <div className="flex items-start gap-6">
          <Skeleton className="h-20 w-20 rounded-lg sm:h-24 sm:w-24" />
          <div className="grid flex-1 content-start gap-3"><Skeleton className="h-3 w-24" /><Skeleton className="h-9 w-72 max-w-full" /><Skeleton className="h-4 w-full max-w-xl" /></div>
        </div>
        <div className="h-[7px] border-y-0 bg-foreground/80" />
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="grid xl:grid-cols-[1.45fr_1fr]">
          <div className="grid gap-4 p-8"><Skeleton className="h-3 w-40" /><Skeleton className="h-16 w-80 max-w-full" /><Skeleton className="h-5 w-32" /><Skeleton className="h-11 w-full max-w-lg" /></div>
          <div className="grid divide-y border-t xl:border-l xl:border-t-0">{[0, 1, 2].map((i) => <div key={i} className="flex items-center justify-between p-6"><div className="grid gap-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-8 w-28" /></div><Skeleton className="h-10 w-24" /></div>)}</div>
        </div>
        <div className="border-t p-6"><Skeleton className="h-72 w-full" /><Skeleton className="mt-3 h-20 w-full" /></div>
      </div>
      <div className="grid gap-10 xl:grid-cols-12"><div className="grid gap-4 xl:col-span-5"><Skeleton className="h-6 w-40" /><Skeleton className="h-52 w-full" /></div><div className="grid gap-4 xl:col-span-7"><Skeleton className="h-6 w-32" /><Skeleton className="h-52 w-full" /></div></div>
      <div className="grid gap-10 xl:grid-cols-12"><Skeleton className="h-64 xl:col-span-8" /><Skeleton className="h-64 xl:col-span-4" /></div>
    </div>
  )
}
