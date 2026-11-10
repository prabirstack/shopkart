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

## Admin console access

`/admin/*` needs a signed-in staff account, enforced in three independent layers:

1. `proxy.ts` redirects requests with no session cookie to `/login?next=...` (a fast, optimistic check).
2. The admin layout (`components/admin/admin-gate.tsx`) runs on the server for every request, validates the session and reads the
   role from the database, then checks the section's permission (`features/admin/access.ts`). Customers see "this area is for staff";
   a staff role without the permission sees "no access" and the page content is never rendered. Unknown admin paths are owner-only.
3. Every `/api/v1/admin/*` endpoint checks the same permission matrix itself, so the data is protected even if a screen were bypassed.

The sidebar only lists sections the role may open. `proxy.ts` always overwrites the `x-pathname` header the gate relies on, so a client
cannot forge it. Denial screens are rendered with status 200 because the layout streams; the APIs return real 401/403.
Seeded dev staff accounts: `owner@`, `catalog-editor@`, `warehouse@`, `support@`, `finance@shopkart.local`.

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

## Storefront data and caching

The storefront reads the same database as the admin. Server pages use the cached loaders in `features/catalog/data.ts` and
`features/articles/data.ts` (`"use cache"` with a `catalog` or `content` tag, refreshed every few minutes). Any API call that
changes what shoppers can see (products, stock, reviews, articles, orders reserving or releasing stock) expires the tag
immediately through the `invalidates` option of `route()`, so an admin edit shows on the shop at once. Client components that hold
only product ids (cart, wishlist, compare) fetch current prices and stock with `GET /products/by-ids`.

**Uploads** (`POST admin/uploads`, multipart/form-data with `file` and `kind` = `product` | `banner`; needs `catalog:write` or
`banners:write` respectively; 30 a minute per account): validates by file content (JPEG, PNG, WebP, AVIF), re-encodes to WebP
without metadata and returns `201 {data:{url,width,height,bytes}}` with `url` like `/media/products/<uuid>.webp`. Errors: 413 over 5 MB
(body cap 6 MB), 422 wrong type, corrupt, too small or too large in pixels, 403, 429. A file is only attached when its URL is saved: send
`images: [{url, alt, width?, height?}]` (at most 8, first is the main photo) on `POST/PATCH admin/products` (the set is replaced in one transaction),
and `image: {url, alt, width?, height?} | null` on `POST/PATCH admin/banners`. Only URLs of uploaded files of the right kind are accepted (products
also accept the demo `/images/products/*` files). Files that lose their last reference are deleted after the save. Uploads are served by `GET /media/<key>`.
Banner changes expire the `content` cache tag.

Extra public endpoints: `GET /products/by-ids?ids=` (up to 50), `GET /search/suggest?q=` (typo-tolerant, uses PostgreSQL trigram
similarity), `POST /orders/track {number, email}` (identical answer for a missing order and a wrong email, 10 a minute),
`POST /reviews/:id/helpful` (signed in; one vote per person; not on your own review), `GET /reviews/voted?ids=`.
`POST /coupons/validate` is account-aware when signed in (one use per customer). Cancelling an unpaid order frees its coupon use.

## Abandoned checkouts

An unpaid order holds its stock. `POST /internal/expire-orders` (header `Authorization: Bearer $CRON_SECRET`; does not exist
without `CRON_SECRET`) cancels unpaid orders older than `ORDER_HOLD_MINUTES` (default 30) and returns their stock and coupon use.
Run it from a scheduler every few minutes.

## Payments

`paymentMode()` (lib/api/payments.ts) decides how payments work, and `GET /payments/config` tells the checkout:

| Mode | When | Behaviour |
| --- | --- | --- |
| `mock` | `ENABLE_MOCK_PAYMENTS=1` in a non-production build | Dummy payment window; orders get `order_mock_` ids signed with `MOCK_PAYMENT_SECRET`. |
| `razorpay` | `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` set | Real Razorpay. Keys starting `rzp_test_` are Razorpay's **test mode** (no real money). |
| `none` | neither | `POST /orders` answers 503 instead of saving an order nobody can pay. |

The dummy gateway wins when it is on, so **leave `ENABLE_MOCK_PAYMENTS` empty to use Razorpay**.

### Real Razorpay (test mode)

1. In the Razorpay dashboard switch to **Test Mode**, then Account & Settings, API Keys, Generate. Put the Key Id and Key Secret in `.env`
   as `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` (the secret stays on the server; the key id is public).
2. Webhook (needed so a paid order is confirmed even if the shopper closes the tab): Settings, Webhooks, add
   `https://<public-url>/api/v1/webhooks/razorpay`, choose a secret, tick `payment.captured` and `payment.failed`, and put that secret in
   `RAZORPAY_WEBHOOK_SECRET`. Locally Razorpay can't reach `localhost`, so expose the dev server with a tunnel (for example
   `cloudflared tunnel --url http://localhost:3000` or `ngrok http 3000`). Without the webhook, payments are still confirmed by the
   browser's own verify call.
3. Pay with Razorpay's test details (shown in their popup): card `4111 1111 1111 1111` with any future expiry and CVV, UPI
   `success@razorpay` (or `failure@razorpay` to see a decline), or the Success/Failure buttons on the test netbanking page.

How it works: the order is saved first (so the amount is the stored total), then the matching Razorpay order is created through their
API and its id attached. If Razorpay can't be reached the order is cancelled and its stock released, and the shopper is told nothing
was charged. The popup returns a signature that `POST /payments/verify` checks against `RAZORPAY_KEY_SECRET`; the amount comes from
our own payment row, never from the browser. Admin refunds of a real payment (full order or a return) call the Razorpay refund API while the order row is locked
in the database, with an idempotency key, and only mark the order or return refunded if it succeeds. A double click or two admins at
once therefore queue up and the money leaves once (a dummy-gateway payment is just recorded). Going live later means switching to live keys: nothing else changes.

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
