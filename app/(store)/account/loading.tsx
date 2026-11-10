import { Skeleton } from "@/components/ui/skeleton"

// Account pages read the session and the database on every request. This is the placeholder shown while they do,
// so moving between account pages stays instant.
export default function AccountLoading() {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-9 w-56 rounded-lg" />
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  )
}
