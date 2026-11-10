"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthCard } from "@/components/info/auth-card"
import { AuthForm } from "@/components/auth/auth-form"
import { Button } from "@/components/ui/button"
import { authClient, safeNext } from "@/lib/auth-client"

// Google sign-in is shown only when the server has the Google keys (see .env.example).
const GOOGLE = process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "1"

export default function LoginPage() {
  const router = useRouter()
  const next = () => safeNext(new URLSearchParams(window.location.search).get("next"))
  return (
    <AuthCard title="Welcome back" intro="Sign in to track orders, save favourites and check out faster.">
      <AuthForm submitLabel="Sign in"
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
        ]}
        belowFields={(
          <div className="-mt-1 flex items-center justify-between gap-3 text-sm">
            {/* Checked: a 30-day session. Unchecked: a session cookie that ends when the browser closes (use this on shared computers). */}
            <label className="flex cursor-pointer items-center gap-2 text-muted-foreground"><input type="checkbox" name="remember" defaultChecked className="size-4 rounded accent-primary" /> Remember me</label>
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">Forgot password?</Link>
          </div>
        )}
        onSubmit={async ({ email, password, remember }) => {
          const { error } = await authClient.signIn.email({ email, password, rememberMe: remember === "on" })
          // Same message for "no such user" and "wrong password", so accounts can't be discovered.
          if (error) return error.status === 429 ? "Too many attempts. Wait a minute and try again." : "That email and password don't match."
          router.push(next()); router.refresh()
        }}
        footer={GOOGLE && (
          <>
            <p className="flex items-center gap-3 text-xs text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">or</p>
            <Button type="button" variant="outline" size="lg" className="h-11 rounded-xl" onClick={() => authClient.signIn.social({ provider: "google", callbackURL: next() })}>Continue with Google</Button>
          </>
        )} />
      <p className="text-center text-sm text-muted-foreground">New here? <Link href="/register" className="font-medium text-primary hover:underline">Create an account</Link></p>
    </AuthCard>
  )
}
