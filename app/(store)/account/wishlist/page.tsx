"use client"
import Link from "next/link"
import { Heart } from "lucide-react"
import { ProductCard } from "@/components/store/product-card"
import { buttonVariants } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { useHydrated } from "@/features/cart/hooks"
import { productById } from "@/features/catalog/demo"
import { useWishlist } from "@/features/wishlist/store"

export default function AccountWishlistPage() {
  const ids = useWishlist((s) => s.ids)
  const hydrated = useHydrated()
  const items = ids.flatMap((id) => { const p = productById(id); return p ? [p] : [] })
  return (
    <>
      <h1 className="store-title !text-3xl">Wishlist{hydrated && items.length > 0 && <span className="ml-2 text-lg font-medium text-muted-foreground">({items.length})</span>}</h1>
      {!hydrated ? <Skeleton className="h-64 w-full rounded-xl" /> : items.length === 0 ? (
        <Empty className="rounded-xl border">
          <EmptyHeader><EmptyMedia variant="icon"><Heart aria-hidden="true" /></EmptyMedia><EmptyTitle>Your wishlist is empty</EmptyTitle><EmptyDescription>Tap the heart on any product to save it here for later.</EmptyDescription></EmptyHeader>
          <EmptyContent><Link href="/products" className={buttonVariants()}>Discover products</Link></EmptyContent>
        </Empty>
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{items.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}</ul>
      )}
    </>
  )
}
