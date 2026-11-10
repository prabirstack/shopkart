"use client"
import Link from "next/link"
import { useState } from "react"
import { Mail, ShoppingBag, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"

const input = "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"

export default function LoginPage() {
  const [mode, setMode] = useState<"email" | "phone">("email")
  const [note, setNote] = useState("")
  return (
    <main className="store-container grid place-items-center py-10">
      <div className="grid w-full max-w-md gap-5 rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="grid justify-items-center gap-2 text-center">
          <ShoppingBag className="size-10 text-primary" aria-hidden="true" />
          <h1 className="store-title !text-2xl">Sign in to ShopKart</h1>
          <p className="text-sm text-muted-foreground">Track orders, save favourites and check out faster.</p>
        </div>
        <div role="group" aria-label="Sign-in method" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm font-medium">
          {([["email", "Email", Mail], ["phone", "Mobile", Smartphone]] as const).map(([id, label, Icon]) => (
            <button key={id} type="button" aria-pressed={mode === id} onClick={() => setMode(id)}
              className={`flex items-center justify-center gap-2 rounded-md py-2 ${mode === id ? "bg-background shadow-sm" : "text-muted-foreground"}`}><Icon className="size-4" aria-hidden="true" /> {label}</button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setNote("Sign-in isn't connected yet. It arrives in the identity chapters.") }} className="grid gap-4">
          {mode === "email" ? (
            <>
              <div className="grid gap-1.5"><label htmlFor="email" className="text-sm font-medium">Email</label><input id="email" type="email" required autoComplete="email" className={input} /></div>
              <div className="grid gap-1.5"><label htmlFor="password" className="text-sm font-medium">Password</label><input id="password" type="password" required autoComplete="current-password" className={input} /></div>
            </>
          ) : (
            <div className="grid gap-1.5"><label htmlFor="mobile" className="text-sm font-medium">Mobile number</label><input id="mobile" inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} required autoComplete="tel-national" className={input} /><p className="text-xs text-muted-foreground">We&apos;ll send a one-time code.</p></div>
          )}
          <Button type="submit" size="lg" className="h-11">{mode === "email" ? "Sign in" : "Send code"}</Button>
          <p role="status" className="text-center text-xs text-muted-foreground">{note}</p>
        </form>
        <Button type="button" variant="outline" size="lg" className="h-11" onClick={() => setNote("Google sign-in isn't connected yet.")}>Continue with Google</Button>
        <p className="text-center text-sm text-muted-foreground">New here? <Link href="/login" className="font-medium text-primary hover:underline">Create an account</Link></p>
        <p className="text-center text-xs text-muted-foreground">Want to look around? <Link href="/account" className="underline">Open the demo account</Link>.</p>
      </div>
    </main>
  )
}
