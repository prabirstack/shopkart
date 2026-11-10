import type { ReactNode } from "react"
import { ShoppingBag } from "lucide-react"

export function AuthCard({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <main className="relative isolate grid flex-1 place-items-center overflow-hidden px-4 py-8 sm:py-12">
      <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 -z-10 size-[34rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-50 [background-image:radial-gradient(circle_at_1px_1px,oklch(0.528_0.202_21.4/0.16)_1px,transparent_0)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="grid w-full max-w-md gap-6 rounded-3xl border bg-card/95 p-6 shadow-xl shadow-primary/5 ring-1 ring-black/[0.02] backdrop-blur sm:p-9">
        <div className="grid justify-items-center gap-3 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/75 text-primary-foreground shadow-lg shadow-primary/30"><ShoppingBag className="size-7" aria-hidden="true" /></span>
          <h1 className="store-title !text-2xl">{title}</h1>
          <p className="text-sm text-muted-foreground">{intro}</p>
        </div>
        {children}
      </div>
    </main>
  )
}
