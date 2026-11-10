import "server-only"

import argon2 from "argon2"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"

import { db } from "@/lib/db"
import * as schema from "@/lib/db/schema"
import { sendEmail } from "@/lib/email"

const origin = process.env.APP_ORIGIN ?? "http://localhost:3000"
const secret = process.env.BETTER_AUTH_SECRET
if (!secret && process.env.NODE_ENV === "production") throw new Error("BETTER_AUTH_SECRET is not set")

export const auth = betterAuth({
  baseURL: origin,
  secret: secret ?? "dev-only-secret-change-me-dev-only-secret",
  trustedOrigins: [origin],

  // Better Auth reads and writes through our Drizzle tables. Plural table names are mapped here.
  database: drizzleAdapter(db, { provider: "pg", usePlural: true, schema }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    autoSignIn: true,
    // Argon2id, so accounts seeded with argon2 hashes keep working and the hash is memory-hard.
    password: { hash: (password) => argon2.hash(password), verify: ({ hash, password }) => argon2.verify(hash, password).catch(() => false) },
    sendResetPassword: async ({ user, url }) => { await sendEmail({ to: user.email, subject: "Reset your ShopKart password", text: `Reset your password: ${url}\n\nIf you didn't ask for this, ignore this email.` }) },
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => { await sendEmail({ to: user.email, subject: "Verify your ShopKart email", text: `Confirm your email: ${url}` }) },
  },

  // Optional Google sign-in: only enabled when both keys are set.
  socialProviders: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET } }
    : {},

  user: {
    additionalFields: {
      // input:false means a sign-up request can never choose its own role.
      role: { type: "string", required: false, defaultValue: "customer", input: false },
      phone: { type: "string", required: false },
    },
  },

  // No cookie cache: the role is read from the database on every request, so removing a staff member's
  // access takes effect immediately instead of after the cache expires.
  session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },

  // Sign-in and sign-up are the brute-force targets, so they get far tighter limits than the default.
  rateLimit: { enabled: process.env.DISABLE_RATE_LIMIT !== "1", window: 60, max: 100, customRules: { "/sign-in/email": { window: 60, max: 5 }, "/sign-up/email": { window: 60, max: 5 }, "/request-password-reset": { window: 60, max: 3 } } },

  advanced: {
    cookiePrefix: "sk",
    useSecureCookies: process.env.NODE_ENV === "production",
    // The database generates ids (uuidv7), so Better Auth must not supply its own.
    database: { generateId: false },
  },

  // nextCookies must be last: it lets server actions set the session cookie.
  plugins: [nextCookies()],
})

export type Auth = typeof auth
