"use client"
import { useId, useState, type ReactNode } from "react"
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export type AuthField = { name: string; label: string; type?: "text" | "email" | "tel" | "password"; autoComplete?: string; hint?: string; required?: boolean; minLength?: number; pattern?: string; maxLength?: number; inputMode?: "numeric" | "text" }

const input = "h-11 w-full rounded-xl border bg-background px-3.5 text-sm shadow-xs outline-none transition hover:border-primary/40 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15 aria-[invalid=true]:border-destructive"

/**
 * Form for sign-in style pages. `onSubmit` returns an error message to show, or nothing on success
 * (the caller navigates). Errors are announced to screen readers, and the button shows progress.
 */
export function AuthForm({ fields, submitLabel, onSubmit, footer, belowFields }: {
  fields: AuthField[]; submitLabel: string; onSubmit: (values: Record<string, string>) => Promise<string | void>; footer?: ReactNode; belowFields?: ReactNode
}) {
  const uid = useId()
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [shown, setShown] = useState<Record<string, boolean>>({})

  return (
    <form noValidate={false} className="grid gap-4" onSubmit={async (e) => {
      e.preventDefault()
      if (busy) return
      setBusy(true); setError("")
      const values = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>
      try { const msg = await onSubmit(values); if (msg) setError(msg) } catch { setError("Something went wrong. Please try again.") } finally { setBusy(false) }
    }}>
      {fields.map((f) => {
        const id = `${uid}-${f.name}`
        const isPassword = f.type === "password"
        return (
          <div key={f.name} className="grid gap-1.5">
            <label htmlFor={id} className="text-sm font-medium">{f.label}</label>
            <div className="relative">
              <input id={id} name={f.name} type={isPassword && shown[f.name] ? "text" : f.type ?? "text"} required={f.required ?? true} minLength={f.minLength} maxLength={f.maxLength} pattern={f.pattern} inputMode={f.inputMode}
                autoComplete={f.autoComplete} aria-describedby={f.hint ? `${id}-hint` : undefined} className={`${input} ${isPassword ? "pr-11" : ""}`} />
              {isPassword && (
                <button type="button" onClick={() => setShown((s) => ({ ...s, [f.name]: !s[f.name] }))} aria-label={shown[f.name] ? "Hide password" : "Show password"} aria-pressed={!!shown[f.name]}
                  className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50">
                  {shown[f.name] ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                </button>
              )}
            </div>
            {f.hint && <p id={`${id}-hint`} className="text-xs text-muted-foreground">{f.hint}</p>}
          </div>
        )
      })}
      {belowFields}
      <div role="alert" className={error ? "" : "hidden"}>
        {error && <p className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{error}</p>}
      </div>
      <Button type="submit" size="lg" disabled={busy} className="h-11 rounded-xl text-base font-semibold shadow-md shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0">
        {busy && <Loader2 className="animate-spin" aria-hidden="true" />}{busy ? "Please wait…" : submitLabel}
      </Button>
      {footer}
    </form>
  )
}
