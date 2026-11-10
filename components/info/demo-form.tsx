"use client"
import { useId, useState } from "react"
import { ChevronDown, Info } from "lucide-react"
import { Button } from "@/components/ui/button"

export type FormField = {
  name: string; label: string; type?: "text" | "email" | "tel" | "password" | "textarea" | "select" | "number"
  required?: boolean; options?: string[]; hint?: string; autoComplete?: string; half?: boolean
}

const input = "w-full rounded-xl border bg-background px-3.5 text-sm shadow-xs outline-none transition placeholder:text-muted-foreground/70 hover:border-primary/40 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15"

/**
 * Layout-only form: it validates in the browser and says plainly that nothing is sent yet.
 * Real submission (email, database, anti-spam) is added by the chapter that needs it.
 */
export function DemoForm({ fields, submitLabel, notice, className = "" }: { fields: FormField[]; submitLabel: string; notice: string; className?: string }) {
  const uid = useId()
  const [message, setMessage] = useState("")
  return (
    <form onSubmit={(e) => { e.preventDefault(); setMessage(notice) }} className={`grid gap-5 sm:grid-cols-2 ${className}`}>
      {fields.map((f) => {
        const id = `${uid}-${f.name}`
        return (
          <div key={f.name} className={`grid content-start gap-1.5 ${f.half ? "" : "sm:col-span-2"}`}>
            <label htmlFor={id} className="text-sm font-medium">{f.label}{f.required && <span aria-hidden="true" className="text-destructive"> *</span>}</label>
            {f.type === "textarea" ? <textarea id={id} name={f.name} required={f.required} rows={5} className={`${input} min-h-32 resize-y py-3`} />
              : f.type === "select" ? (
                <div className="relative">
                  <select id={id} name={f.name} required={f.required} defaultValue="" className={`${input} h-11 cursor-pointer appearance-none pr-10`}><option value="" disabled>Choose…</option>{f.options?.map((o) => <option key={o}>{o}</option>)}</select>
                  <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              ) : <input id={id} name={f.name} type={f.type ?? "text"} required={f.required} autoComplete={f.autoComplete} aria-describedby={f.hint ? `${id}-hint` : undefined} className={`${input} h-11`} />}
            {f.hint && <p id={`${id}-hint`} className="text-xs text-muted-foreground">{f.hint}</p>}
          </div>
        )
      })}
      <div className="sm:col-span-2"><Button type="submit" size="lg" className="h-11 w-full rounded-xl text-base font-semibold shadow-md shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 active:translate-y-0 sm:w-auto sm:px-8">{submitLabel}</Button></div>
      <div role="status" className={message ? "sm:col-span-2" : "hidden"}>
        {message && <p className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{message}</p>}
      </div>
    </form>
  )
}
