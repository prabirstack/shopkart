import { Authorized } from "@/components/admin/authorized"
import { ReviewsView } from "@/components/admin/reviews-view"
import { loadAdminReviews } from "@/lib/db/queries"

// Every admin page is personal (it reads the session and the database on each request), so there is nothing to
// prerender: allow a blocking route instead of a static shell.
export const instant = false

async function Data() {
  return <ReviewsView reviews={await loadAdminReviews()} />
}

export default function Page() {
  return <Authorized section="/admin/reviews"><Data /></Authorized>
}
