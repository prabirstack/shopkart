import { Button } from "@/components/ui/button"
import { demoUser } from "@/features/account/demo"

const input = "h-10 w-full rounded-lg border bg-muted/40 px-3 text-sm"

export default function AccountProfilePage() {
  return (
    <>
      <h1 className="store-title !text-3xl">Profile</h1>
      <form className="grid max-w-xl gap-4 rounded-xl border bg-card p-5" aria-describedby="profile-note">
        {[["name", "Full name", demoUser.name], ["email", "Email", demoUser.email], ["phone", "Mobile number", demoUser.phone]].map(([id, label, value]) => (
          <div key={id} className="grid gap-1.5"><label htmlFor={id} className="text-sm font-medium">{label}</label><input id={id} defaultValue={value} readOnly className={input} /></div>
        ))}
        <p id="profile-note" className="text-xs text-muted-foreground">Editing your profile, changing your password and managing sign-in methods arrive in the identity chapters.</p>
        <div><Button type="button" disabled>Save changes</Button></div>
      </form>
    </>
  )
}
