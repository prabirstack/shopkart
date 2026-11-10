"use client"
import { useSyncExternalStore } from "react"
import { Heart } from "lucide-react"
import { useWishlist } from "./store"

const useWishlistHydrated = () =>
  useSyncExternalStore(
    (cb) => useWishlist.persist.onFinishHydration(cb),
    () => useWishlist.persist.hasHydrated(),
    () => false,
  )

export function WishlistButton({ productId, title, variant = "icon" }: {
  productId: string; title: string; variant?: "icon" | "full"
}) {
  const ids = useWishlist((s) => s.ids)
  const toggle = useWishlist((s) => s.toggle)
  const hydrated = useWishlistHydrated()
  const saved = hydrated && ids.includes(productId)
  const label = saved ? `Remove ${title} from wishlist` : `Save ${title} to wishlist`

  if (variant === "full") {
    return (
      <button type="button" aria-pressed={saved} onClick={() => toggle(productId)}
        className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 ${saved ? "border-primary text-primary" : ""}`}>
        <Heart className={`size-4 ${saved ? "fill-primary" : ""}`} aria-hidden="true" />
        {saved ? "Saved to wishlist" : "Add to wishlist"}
      </button>
    )
  }
  return (
    <button type="button" aria-pressed={saved} aria-label={label} title={saved ? "Remove from wishlist" : "Save to wishlist"} onClick={() => toggle(productId)}
      className="grid size-8 place-items-center rounded-full bg-background/90 text-muted-foreground shadow-sm transition-colors hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/50">
      <Heart className={`size-4 ${saved ? "fill-primary text-primary" : ""}`} aria-hidden="true" />
    </button>
  )
}
