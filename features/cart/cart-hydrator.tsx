"use client"
import { useEffect } from "react"
import { useWishlist } from "@/features/wishlist/store"
import { useCart } from "./store"

/** Loads saved cart and wishlist from localStorage once, after the first render. */
export function CartHydrator() {
  useEffect(() => {
    void useCart.persist.rehydrate()
    void useWishlist.persist.rehydrate()
  }, [])
  return null
}
