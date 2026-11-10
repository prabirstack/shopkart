import Link from "next/link"
import { AuthCard } from "@/components/info/auth-card"
import { DemoForm } from "@/components/info/demo-form"

export default function RegisterPage() {
  return (
    <AuthCard title="Create your account" intro="Track orders, save favourites and check out faster.">
      <DemoForm submitLabel="Create account" notice="Sign-up isn't connected yet. It arrives in the identity chapters."
        fields={[
          { name: "name", label: "Full name", required: true, autoComplete: "name" },
          { name: "email", label: "Email", type: "email", required: true, autoComplete: "email" },
          { name: "phone", label: "Mobile number", type: "tel", required: true, autoComplete: "tel-national", hint: "We'll send a code to verify it." },
          { name: "password", label: "Password", type: "password", required: true, autoComplete: "new-password", hint: "At least 8 characters." },
        ]} />
      <p className="text-center text-sm text-muted-foreground">Already have an account? <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link></p>
    </AuthCard>
  )
}
