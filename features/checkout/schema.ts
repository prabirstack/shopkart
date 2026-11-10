import { z } from "zod"

export const INDIAN_STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
  "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab", "Rajasthan",
  "Tamil Nadu", "Telangana", "Uttar Pradesh", "Uttarakhand", "West Bengal",
] as const

/** Client-side check for fast feedback. The server must validate the same rules again. */
export const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number"),
  line1: z.string().trim().min(5, "Enter your street address").max(120),
  line2: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2, "Enter your city").max(60),
  state: z.enum(INDIAN_STATES, { message: "Choose your state" }),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a 6-digit PIN code"),
  terms: z.literal(true, { message: "Please accept the terms to continue" }),
})
export type CheckoutValues = z.input<typeof checkoutSchema>
