import type { DocNode } from "./types"

// Small builders so seed articles read like the content they are.
const text = (t: string, marks?: DocNode["marks"]): DocNode => ({ type: "text", text: t, ...(marks && { marks }) })
/** Inline text: plain strings, or [text, "bold" | "italic"] pairs, or links as [text, "link", href]. */
type Inline = string | [string, "bold" | "italic"] | [string, "link", string]
const inline = (parts: Inline[]): DocNode[] => parts.map((p) => typeof p === "string" ? text(p) : p[1] === "link" ? text(p[0], [{ type: "link", attrs: { href: p[2] } }]) : text(p[0], [{ type: p[1] }]))
const body = (t: string | Inline[]) => (typeof t === "string" ? [text(t)] : inline(t))

export const p = (t: string | Inline[]): DocNode => ({ type: "paragraph", content: body(t) })
export const h2 = (t: string): DocNode => ({ type: "heading", attrs: { level: 2 }, content: [text(t)] })
export const h3 = (t: string): DocNode => ({ type: "heading", attrs: { level: 3 }, content: [text(t)] })
export const ul = (items: (string | Inline[])[]): DocNode => ({ type: "bulletList", content: items.map((i) => ({ type: "listItem", content: [p(i)] })) })
export const ol = (items: (string | Inline[])[]): DocNode => ({ type: "orderedList", content: items.map((i) => ({ type: "listItem", content: [p(i)] })) })
export const quote = (t: string): DocNode => ({ type: "blockquote", content: [p(t)] })
export const doc = (...content: DocNode[]): DocNode => ({ type: "doc", content })

export const emptyDoc: DocNode = { type: "doc", content: [{ type: "paragraph" }] }
