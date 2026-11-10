import type { ReactNode } from "react"

/** Consistent heading for every account page: title, one-line description, optional action. */
export function AccountTitle({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="store-title !text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </header>
  )
}
