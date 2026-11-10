# API

Everything is under `/api/v1`, except sign-in which Better Auth serves under `/api/auth/*`.
Every endpoint goes through one wrapper (`lib/api/http.ts`), so they all behave the same.

## Conventions

* Success: `{ "data": ... }`. Failure: `{ "error": { "code", "message", "details?" }, "requestId" }`.
* Every response has an `X-Request-Id`. A 500 only ever shows that id; the real error is in the server log.
* Status codes: 400 bad JSON, 401 signed out, 403 not allowed (or cross-site request), 404 not found,
  409 conflict with current state (out of stock, bad transition), 413 too large, 415 not JSON,
  422 validation (with per-field `details`), 429 rate limited (with `Retry-After`).
* Money is integer paise. Dates are ISO 8601.
* Anonymous catalog GETs are CDN-cacheable; anything with a session is `no-store`.
* State-changing requests must come from our own origin (or send no `Origin`, like curl).
* Lists are paginated: `?page=1&pageSize=20`. Search is `?q=` and uses Postgres full-text plus partial matching.

## Authentication (Better Auth)

`POST /api/auth/sign-up/email`, `/sign-in/email`, `/sign-out`, `GET /get-session`,
`/request-password-reset`, `/reset-password`, `/change-password`, `/verify-email`, optional Google.
Sessions are an httpOnly, SameSite=Lax cookie (`sk.session_token`, Secure in production), stored in the database.
Passwords are hashed with argon2id. A sign-up can never choose its own role. Sign-in is limited to 5 a minute.

Roles: `customer`, `owner`, `catalog_editor`, `warehouse`, `support`, `finance`. Permissions are in
`lib/api/permissions.ts`. The role is read from the database on every request, so removing access is immediate.

## Endpoints

**Public:** `GET products`, `products/facets`, `products/:slug`, `products/:slug/related`, `products/:slug/reviews`,
`categories`, `brands`, `articles`, `articles/:slug`, `banners?slot=`, `health`; `POST coupons/validate`.

**Signed in:** `GET me`; `POST products/:slug/reviews` (held for moderation);
`POST orders` (send `Idempotency-Key`), `GET orders`, `GET orders/:number`, `POST orders/:number/cancel` (only before payment);
`POST payments/verify`; `account/profile` (GET, PATCH), `account/addresses` (GET, POST), `account/addresses/:id` (PUT, DELETE),
`account/wishlist` (GET), `account/wishlist/:productId` (PUT, DELETE).

**Webhook:** `POST webhooks/razorpay` is authenticated by HMAC signature over the raw body, deduplicated by event id.

**Staff** (`admin/*`, permission in brackets): `dashboard` (reports:read), `refs`, `products` + `products/:id` (catalog:write; DELETE archives),
`inventory/low-stock`, `inventory/:productId/movements` (inventory:read), `inventory/:productId/adjust` (inventory:write),
`orders`, `orders/:number` (orders:read), `.../advance` (orders:fulfil), `.../cancel` (orders:cancel),
`reviews` + `reviews/:id` (reviews:moderate), `articles` (content:write), `coupons` (coupons:write), `banners` (banners:write),
`customers` (customers:read), `returns` (returns:manage), `settings` (settings:write).

## Checkout flow

1. `POST /orders` with items, customer and address and an `Idempotency-Key`. The server prices everything, reserves stock,
   and returns the order plus `payment.providerOrderId` and `amountPaise`.
2. The browser pays with Razorpay, then calls `POST /payments/verify`. Both that call and the webhook confirm the same payment safely.
3. Staff move the order `paid -> packed -> shipped -> delivered` through `admin/orders/:number/advance`.

## Production notes

* Set `BETTER_AUTH_SECRET`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `APP_ORIGIN`. The app refuses to start without the first.
* Implement `lib/email.ts` with a mail provider; until then production password-reset and verification fail loudly instead of silently.
* Rate limiting is in process memory (accurate for one instance). For several instances, back `lib/api/rate-limit.ts` with Redis.
* Rate limits are keyed on the client IP **and** the signed-in account. Set `TRUSTED_PROXY_HOPS` to the number of reverse proxies in
  front of the app (default 1): the client address is counted from the right of `X-Forwarded-For`, because the left side is client-controlled.
  With `0` (or no header) there is no trustworthy per-client address, so signed-in callers are limited per account and anonymous requests share one bucket with a 20x higher ceiling:
  production should always run behind a proxy with `TRUSTED_PROXY_HOPS` >= 1.
* Webhooks: an event counts as a duplicate only once it has been fully processed; a half-processed one is retried.
