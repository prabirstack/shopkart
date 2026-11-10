import type { ReactNode } from "react"
import { ShoppingBag } from "lucide-react"

export function AuthCard({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <main className="store-container grid place-items-center py-10">
      <div className="grid w-full max-w-md gap-5 rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="grid justify-items-center gap-2 text-center">
          <ShoppingBag className="size-10 text-primary" aria-hidden="true" />
          <h1 className="store-title !text-2xl">{title}</h1>
          <p className="text-sm text-muted-foreground">{intro}</p>
        </div>
        {children}
      </div>
    </main>
  )
}
