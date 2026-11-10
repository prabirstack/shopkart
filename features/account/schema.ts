import { z } from "zod"

// Same rules as the API (lib/api/schemas.ts), checked in the browser first for quick feedback. The server checks again.
const phone = z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number.")

export const addressSchema = z.object({
  label: z.string().trim().min(1, "Give this address a name, like Home.").max(30),
  name: z.string().trim().min(2, "Enter the recipient's name.").max(60),
  phone,
  line1: z.string().trim().min(3, "Enter the street address.").max(120),
  line2: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2, "Enter the city.").max(60),
  state: z.string().trim().min(2, "Choose the state.").max(60),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a 6-digit PIN code."),
  isDefault: z.boolean(),
})
export type AddressValues = z.infer<typeof addressSchema>

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name (at least 2 characters).").max(60),
  phone: z.string().trim().refine((v) => v === "" || /^[6-9]\d{9}$/.test(v), "Enter a 10-digit Indian mobile number."),
})
export type ProfileValues = z.infer<typeof profileSchema>

export const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password."),
  newPassword: z.string().min(10, "Use at least 10 characters.").max(128, "Use at most 128 characters."),
  confirm: z.string(),
}).refine((v) => v.newPassword === v.confirm, { path: ["confirm"], message: "The two passwords don't match." })
export type PasswordValues = z.infer<typeof passwordSchema>

export type SavedAddress = { id: string; label: string; name: string; phone: string; line1: string; line2: string | null; city: string; state: string; pincode: string; isDefault: boolean }
