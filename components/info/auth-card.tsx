import type { ReactNode } from "react"

/** The form column of the auth screens: left-aligned heading, then the form. No card, glow or decoration. */
export function AuthCard({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <main className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-12">
      <div className="mx-auto grid w-full max-w-sm gap-8">
        <div className="grid gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{intro}</p>
        </div>
        {children}
      </div>
    </main>
  )
}
