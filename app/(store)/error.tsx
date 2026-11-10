"use client"
import Link from "next/link"
import { TriangleAlert } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"

export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="store-container grid place-items-center py-16">
      <div role="alert" className="grid max-w-md justify-items-center gap-4 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-destructive/10 text-destructive"><TriangleAlert className="size-7" aria-hidden="true" /></span>
        <h1 className="store-title !text-2xl">Something went wrong</h1>
        <p className="text-muted-foreground">We couldn&apos;t load this page. Your cart is safe. Try again, and if it keeps happening, tell us.</p>
        {error.digest && <p className="font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>}
        <div className="flex gap-2"><Button onClick={reset}>Try again</Button><Link href="/" className={buttonVariants({ variant: "outline" })}>Go home</Link></div>
      </div>
    </main>
  )
}
