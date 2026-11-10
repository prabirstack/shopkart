import Link from "next/link"
import type { ReactNode } from "react"
import type { DocNode } from "./types"

/**
 * Renders a TipTap/ProseMirror document to React elements. There is no innerHTML anywhere, so
 * stored content can never inject script. Unknown node types are ignored, and link targets are
 * limited to site paths, http(s), mailto and tel.
 */

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
const plain = (n: DocNode): string => n.text ?? (n.content ?? []).map(plain).join("")

export type TocItem = { id: string; text: string; level: 2 | 3 }
export function tocOf(root: DocNode): TocItem[] {
  return (root.content ?? []).filter((n) => n.type === "heading").map((n) => ({ id: slugify(plain(n)), text: plain(n), level: (n.attrs?.level === 3 ? 3 : 2) as 2 | 3 })).filter((t) => t.text)
}

const safeHref = (raw: unknown): string | null => {
  const href = String(raw ?? "").trim()
  return /^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i.test(href) ? href : null
}

function renderText(n: DocNode, key: number): ReactNode {
  let out: ReactNode = n.text ?? ""
  for (const m of n.marks ?? []) {
    if (m.type === "bold") out = <strong key={`b${key}`}>{out}</strong>
    else if (m.type === "italic") out = <em key={`i${key}`}>{out}</em>
    else if (m.type === "strike") out = <s key={`s${key}`}>{out}</s>
    else if (m.type === "code") out = <code key={`c${key}`}>{out}</code>
    else if (m.type === "link") {
      const href = safeHref(m.attrs?.href)
      if (!href) continue
      out = href.startsWith("/") ? <Link key={`l${key}`} href={href}>{out}</Link> : <a key={`l${key}`} href={href} {...(href.startsWith("http") && { target: "_blank", rel: "noopener noreferrer" })}>{out}</a>
    }
  }
  return out
}

function renderNode(n: DocNode, key: number): ReactNode {
  const kids = () => (n.content ?? []).map((c, i) => renderNode(c, i))
  switch (n.type) {
    case "text": return <span key={key} style={{ display: "contents" }}>{renderText(n, key)}</span>
    case "paragraph": return <p key={key}>{kids()}</p>
    case "heading": { const id = slugify(plain(n)); return n.attrs?.level === 3 ? <h3 key={key} id={id}>{kids()}</h3> : <h2 key={key} id={id}>{kids()}</h2> }
    case "bulletList": return <ul key={key}>{kids()}</ul>
    case "orderedList": return <ol key={key}>{kids()}</ol>
    case "listItem": return <li key={key}>{kids()}</li>
    case "blockquote": return <blockquote key={key}>{kids()}</blockquote>
    case "codeBlock": return <pre key={key}><code>{plain(n)}</code></pre>
    case "horizontalRule": return <hr key={key} />
    case "hardBreak": return <br key={key} />
    default: return null
  }
}

export function RenderDoc({ doc }: { doc: DocNode }) {
  return <div className="article-body">{(doc.content ?? []).map((n, i) => renderNode(n, i))}</div>
}

export const wordCount = (root: DocNode) => plain(root).split(/\s+/).filter(Boolean).length
export const readMinutes = (root: DocNode) => Math.max(1, Math.round(wordCount(root) / 200))
