"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthCard } from "@/components/info/auth-card"
import { AuthForm } from "@/components/auth/auth-form"
import { authClient } from "@/lib/auth-client"

export default function RegisterPage() {
  const router = useRouter()
  return (
    <AuthCard title="Create your account" intro="Track orders, save favourites and check out faster.">
      <AuthForm submitLabel="Create account"
        fields={[
          { name: "name", label: "Full name", autoComplete: "name", minLength: 2, maxLength: 60 },
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "phone", label: "Mobile number (optional)", type: "tel", autoComplete: "tel-national", required: false, pattern: "[6-9][0-9]{9}", maxLength: 10, inputMode: "numeric", hint: "10 digits, for delivery updates." },
          { name: "password", label: "Password", type: "password", autoComplete: "new-password", minLength: 10, maxLength: 128, hint: "At least 10 characters." },
        ]}
        onSubmit={async ({ name, email, phone, password }) => {
          const { error } = await authClient.signUp.email({ name, email, password, ...(phone ? { phone } : {}) } as Parameters<typeof authClient.signUp.email>[0])
          if (error) {
            if (error.status === 429) return "Too many attempts. Wait a minute and try again."
            if (error.code === "USER_ALREADY_EXISTS" || error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") return "An account with this email already exists. Try signing in instead."
            // The phone number is unique, and Better Auth reports that conflict only as a generic failure.
            if (error.code === "FAILED_TO_CREATE_USER" && phone) return "We couldn't create your account. That mobile number may already be linked to another account."
            return error.message ?? "We couldn't create your account."
          }
          router.push("/account"); router.refresh()
        }} />
      <p className="text-sm text-muted-foreground">Already have an account? <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link></p>
    </AuthCard>
  )
}
