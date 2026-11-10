/**
 * Where to send someone after signing in. Only same-site paths are allowed, so a crafted ?next= can't
 * redirect off-site. String prefix checks are not enough: browsers drop tabs and newlines inside URLs, so
 * "/\t/evil.example" reads as "//evil.example". Instead the value is rejected if it contains control
 * characters or whitespace, then resolved with the same URL parser the browser uses and kept only if the
 * result still points at our own origin.
 */
export function safeNext(raw: string | null | undefined, fallback = "/account"): string {
  if (!raw || !raw.startsWith("/") || /[\u0000-\u001f\u007f\s\\]/.test(raw)) return fallback
  try {
    const base = "http://shopkart.invalid"
    const url = new URL(raw, base)
    return url.origin === base ? url.pathname + url.search + url.hash : fallback
  } catch {
    return fallback
  }
}
