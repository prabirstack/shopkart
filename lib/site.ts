/** One place for site identity. Set NEXT_PUBLIC_SITE_URL in production (no trailing slash). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "")
export const SITE_NAME = "ShopKart"
export const SITE_DESCRIPTION = "Shop electronics, fashion, home and kitchen essentials at great prices. Free delivery above ₹699, easy 7-day returns and secure payments."
/** Fixed date: sitemaps must not call new Date() during prerender. Update when content changes. */
export const CONTENT_UPDATED = "2026-11-10"
export const absoluteUrl = (path = "/") => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`
