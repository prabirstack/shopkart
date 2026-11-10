"use client"

/** Last-resort screen if the root layout itself fails. Keep it dependency-free. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0, textAlign: "center" }}>
        <div role="alert">
          <h1>ShopKart is having trouble</h1>
          <p>Please try again in a moment.</p>
          <button onClick={reset} style={{ padding: "0.6rem 1.2rem", background: "#c51632", color: "white", border: 0, borderRadius: 8, cursor: "pointer" }}>Try again</button>
        </div>
      </body>
    </html>
  )
}
