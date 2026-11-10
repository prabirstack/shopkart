import { Skeleton } from "@/components/ui/skeleton"

// The Suspense boundary for every admin page. Pages read the session and the database on each request, and
// Next.js needs a placeholder to show while they do, so navigating between admin pages stays instant.
export default function AdminLoading() {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-9 w-56 rounded-lg" />
      <Skeleton className="h-[28rem] rounded-2xl" />
    </div>
  )
}
