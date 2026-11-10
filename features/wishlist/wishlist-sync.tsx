"use client"
import { useEffect, useRef } from "react"
import { authClient } from "@/lib/auth-client"
import { useWishlist } from "./store"

const api = (id: string, method: "PUT" | "DELETE") => fetch(`/api/v1/account/wishlist/${id}`, { method, credentials: "same-origin" }).then((r) => r.ok)

/**
 * Keeps the saved wishlist in step with the database for signed-in customers. Guests keep using the browser-only list.
 *  - On sign-in: ids saved as a guest are added to the account, then the account's list replaces the local one.
 *  - While signed in: every change to the list (from any button or page) is sent to the server. A change the server
 *    refuses is quietly undone.
 *  - On sign-out: the local list is cleared, so the next person on this device doesn't see it.
 * Renders nothing. Mount it once, next to the other hydrators.
 */
export function WishlistSync() {
  const { data: session } = authClient.useSession()
  const userId = session?.user.id
  const previous = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!userId) {
      if (previous.current) useWishlist.setState({ ids: [] })
      previous.current = undefined
      return
    }
    previous.current = userId
    let live = true
    let paused = true // true while we are changing the list ourselves, so those changes are not sent back
    const silently = (fn: () => void) => { const was = paused; paused = true; try { fn() } finally { paused = was } }

    const unsubscribe = useWishlist.subscribe((state, before) => {
      if (paused) return
      const added = state.ids.filter((id) => !before.ids.includes(id))
      const removed = before.ids.filter((id) => !state.ids.includes(id))
      for (const id of added) void api(id, "PUT").catch(() => false).then((ok) => { if (!ok && live) silently(() => useWishlist.setState((s) => ({ ids: s.ids.filter((x) => x !== id) }))) })
      for (const id of removed) void api(id, "DELETE").catch(() => false).then((ok) => { if (!ok && live) silently(() => useWishlist.setState((s) => (s.ids.includes(id) ? s : { ids: [id, ...s.ids] }))) })
    })

    const start = async () => {
      if (!useWishlist.persist.hasHydrated()) await new Promise<void>((resolve) => { const off = useWishlist.persist.onFinishHydration(() => { off(); resolve() }) })
      if (!live) return
      try {
        await Promise.all(useWishlist.getState().ids.map((id) => api(id, "PUT").catch(() => false)))
        const res = await fetch("/api/v1/account/wishlist", { credentials: "same-origin" })
        if (res.ok && live) {
          const ids = ((await res.json()).data as { id: string }[]).map((p) => p.id)
          silently(() => useWishlist.setState({ ids }))
        }
      } catch { /* offline: keep the local list; it will merge next time */ }
      if (live) paused = false
    }
    void start()
    return () => { live = false; unsubscribe() }
  }, [userId])

  return null
}
