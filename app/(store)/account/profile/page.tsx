import { Suspense } from "react"
import { AccountTitle } from "@/components/account/account-title"
import { PasswordForm, ProfileForm } from "@/components/account/profile-forms"
import { Skeleton } from "@/components/ui/skeleton"
import { requireUser } from "@/features/account/session"
import { getProfile } from "@/lib/db/queries"

export const instant = false

async function Profile() {
  const user = await requireUser("/account/profile")
  const profile = await getProfile(user.id)
  return <ProfileForm name={profile?.name ?? user.name} email={user.email} phone={profile?.phone ?? ""} />
}

export default function AccountProfilePage() {
  return (
    <>
      <AccountTitle title="Profile" description="Your name and contact details." />
      <Suspense fallback={<Skeleton className="h-72 max-w-xl rounded-xl" />}><Profile /></Suspense>
      <section aria-labelledby="security" className="grid gap-3">
        <h2 id="security" className="section-title">Password</h2>
        <PasswordForm />
      </section>
    </>
  )
}
