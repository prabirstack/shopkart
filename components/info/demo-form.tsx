"use client"
import { useId, useState } from "react"
import { Button } from "@/components/ui/button"

export type FormField = {
  name: string; label: string; type?: "text" | "email" | "tel" | "password" | "textarea" | "select" | "number"
  required?: boolean; options?: string[]; hint?: string; autoComplete?: string; half?: boolean
}

const input = "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"

/**
 * Layout-only form: it validates in the browser and says plainly that nothing is sent yet.
 * Real submission (email, database, anti-spam) is added by the chapter that needs it.
 */
export function DemoForm({ fields, submitLabel, notice, className = "" }: { fields: FormField[]; submitLabel: string; notice: string; className?: string }) {
  const uid = useId()
  const [message, setMessage] = useState("")
  return (
    <form onSubmit={(e) => { e.preventDefault(); setMessage(notice) }} className={`grid gap-4 sm:grid-cols-2 ${className}`}>
      {fields.map((f) => {
        const id = `${uid}-${f.name}`
        return (
          <div key={f.name} className={`grid gap-1.5 ${f.half ? "" : "sm:col-span-2"}`}>
            <label htmlFor={id} className="text-sm font-medium">{f.label}{f.required && <span aria-hidden="true" className="text-destructive"> *</span>}</label>
            {f.type === "textarea" ? <textarea id={id} name={f.name} required={f.required} rows={5} className={`${input} h-auto py-2`} />
              : f.type === "select" ? <select id={id} name={f.name} required={f.required} defaultValue="" className={input}><option value="" disabled>Choose…</option>{f.options?.map((o) => <option key={o}>{o}</option>)}</select>
              : <input id={id} name={f.name} type={f.type ?? "text"} required={f.required} autoComplete={f.autoComplete} aria-describedby={f.hint ? `${id}-hint` : undefined} className={input} />}
            {f.hint && <p id={`${id}-hint`} className="text-xs text-muted-foreground">{f.hint}</p>}
          </div>
        )
      })}
      <div className="sm:col-span-2"><Button type="submit" size="lg">{submitLabel}</Button></div>
      <p role="status" className="text-sm text-muted-foreground sm:col-span-2">{message}</p>
    </form>
  )
}
