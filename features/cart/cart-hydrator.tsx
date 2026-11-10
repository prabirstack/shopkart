"use client"
import { useEffect } from "react"
import { useArticleStore } from "@/features/articles/store"
import { useCompare } from "@/features/compare/store"
import { useWishlist } from "@/features/wishlist/store"
import { useCart } from "./store"

/** Loads saved cart and wishlist from localStorage once, after the first render. */
export function CartHydrator() {
  useEffect(() => {
    void useCart.persist.rehydrate()
    void useWishlist.persist.rehydrate()
    void useCompare.persist.rehydrate()
    void useArticleStore.persist.rehydrate()
  }, [])
  return null
}
