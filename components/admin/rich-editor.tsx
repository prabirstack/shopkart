"use client"
import { useState } from "react"
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { Bold, Heading2, Heading3, Italic, Link2, List, ListOrdered, Minus, Quote, Redo2, Strikethrough, Undo2, Unlink } from "lucide-react"
import type { DocNode } from "@/features/articles/types"

const SAFE_LINK = /^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i

function Btn({ label, active, disabled, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} aria-pressed={active} disabled={disabled} onClick={onClick}
      onMouseDown={(e) => e.preventDefault() /* keep focus and selection in the editor */}
      className={`grid size-8 place-items-center rounded-md transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-35 ${active ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{children}</button>
  )
}

/**
 * TipTap (ProseMirror) editor. It saves the document as JSON, which the storefront renders with
 * its own renderer, so no raw HTML is ever stored or injected. The editor shares the
 * `.article-body` styles with the storefront, so what you see is what readers get.
 */
export function RichEditor({ value, onChange, invalid, products }: { value: DocNode; onChange: (doc: DocNode) => void; invalid?: boolean; /** Products the "Link a product" picker offers. */ products: { slug: string; title: string }[] }) {
  const editor = useEditor({
    immediatelyRender: false, // avoids a server/client mismatch in Next.js
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false, autolink: false, HTMLAttributes: { rel: "noopener noreferrer" } } }),
      Placeholder.configure({ placeholder: "Start writing your article. Use the toolbar for headings, lists, quotes and links." }),
    ],
    content: value,
    editorProps: { attributes: { class: `article-body min-h-[24rem] px-5 py-4 outline-none`, role: "textbox", "aria-multiline": "true", "aria-label": "Article body" } },
    onUpdate: ({ editor }) => onChange(editor.getJSON() as DocNode),
  })

  if (!editor) return <div className="h-[28rem] animate-pulse rounded-xl border bg-muted/40" aria-busy="true" aria-label="Loading editor" />
  return <EditorShell products={products} editor={editor} invalid={invalid} />
}

function EditorShell({ editor, invalid, products }: { editor: Editor; invalid?: boolean; products: { slug: string; title: string }[] }) {
  const [linkOpen, setLinkOpen] = useState(false)
  const [href, setHref] = useState("")
  const [linkError, setLinkError] = useState("")
  const s = useEditorState({
    editor,
    selector: ({ editor }) => editor ? {
      bold: editor.isActive("bold"), italic: editor.isActive("italic"), strike: editor.isActive("strike"), h2: editor.isActive("heading", { level: 2 }), h3: editor.isActive("heading", { level: 3 }),
      ul: editor.isActive("bulletList"), ol: editor.isActive("orderedList"), quote: editor.isActive("blockquote"), link: editor.isActive("link"),
      canUndo: editor.can().undo(), canRedo: editor.can().redo(), selectionEmpty: editor.state.selection.empty, words: editor.getText().split(/\s+/).filter(Boolean).length,
    } : null,
  })
  if (!s) return null
  const run = editor.chain().focus()

  const applyLink = () => {
    const v = href.trim()
    if (!SAFE_LINK.test(v)) { setLinkError("Use a site path like /products/air-fryer-5-5l, an https:// address, mailto: or tel:."); return }
    if (s.selectionEmpty) editor.chain().focus().insertContent({ type: "text", text: v, marks: [{ type: "link", attrs: { href: v } }] }).run()
    else editor.chain().focus().extendMarkRange("link").setLink({ href: v }).run()
    setLinkOpen(false); setHref(""); setLinkError("")
  }

  return (
    <div className={`overflow-hidden rounded-xl border bg-card ${invalid ? "border-destructive" : ""}`}>
      <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 p-1.5">
        <Btn label="Undo" disabled={!s.canUndo} onClick={() => run.undo().run()}><Undo2 className="size-4" aria-hidden="true" /></Btn>
        <Btn label="Redo" disabled={!s.canRedo} onClick={() => run.redo().run()}><Redo2 className="size-4" aria-hidden="true" /></Btn>
        <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
        <Btn label="Heading 2" active={s.h2} onClick={() => run.toggleHeading({ level: 2 }).run()}><Heading2 className="size-4" aria-hidden="true" /></Btn>
        <Btn label="Heading 3" active={s.h3} onClick={() => run.toggleHeading({ level: 3 }).run()}><Heading3 className="size-4" aria-hidden="true" /></Btn>
        <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
        <Btn label="Bold" active={s.bold} onClick={() => run.toggleBold().run()}><Bold className="size-4" aria-hidden="true" /></Btn>
        <Btn label="Italic" active={s.italic} onClick={() => run.toggleItalic().run()}><Italic className="size-4" aria-hidden="true" /></Btn>
        <Btn label="Strikethrough" active={s.strike} onClick={() => run.toggleStrike().run()}><Strikethrough className="size-4" aria-hidden="true" /></Btn>
        <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
        <Btn label="Bulleted list" active={s.ul} onClick={() => run.toggleBulletList().run()}><List className="size-4" aria-hidden="true" /></Btn>
        <Btn label="Numbered list" active={s.ol} onClick={() => run.toggleOrderedList().run()}><ListOrdered className="size-4" aria-hidden="true" /></Btn>
        <Btn label="Quote" active={s.quote} onClick={() => run.toggleBlockquote().run()}><Quote className="size-4" aria-hidden="true" /></Btn>
        <Btn label="Divider" onClick={() => run.setHorizontalRule().run()}><Minus className="size-4" aria-hidden="true" /></Btn>
        <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
        <Btn label={s.link ? "Edit link" : "Add link"} active={s.link} onClick={() => { setHref(editor.getAttributes("link").href ?? ""); setLinkOpen((o) => !o); setLinkError("") }}><Link2 className="size-4" aria-hidden="true" /></Btn>
        <Btn label="Remove link" disabled={!s.link} onClick={() => run.extendMarkRange("link").unsetLink().run()}><Unlink className="size-4" aria-hidden="true" /></Btn>
        <label className="ml-auto flex items-center gap-2 pl-2 text-xs text-muted-foreground">
          <span className="sr-only sm:not-sr-only">Link a product</span>
          <select aria-label="Link a product" value="" onChange={(e) => { const p = products.find((x) => x.slug === e.target.value); if (!p) return; const mark = { type: "link", attrs: { href: `/products/${p.slug}` } }
            if (s.selectionEmpty) editor.chain().focus().insertContent({ type: "text", text: p.title, marks: [mark] }).run(); else editor.chain().focus().extendMarkRange("link").setLink({ href: `/products/${p.slug}` }).run() }}
            className="h-8 max-w-44 rounded-md border bg-background px-2 text-xs"><option value="">Choose…</option>{products.map((p) => <option key={p.slug} value={p.slug}>{p.title}</option>)}</select>
        </label>
      </div>
      {linkOpen && (
        <div className="flex flex-wrap items-start gap-2 border-b bg-amber-50/60 p-2">
          <div className="grid min-w-56 flex-1 gap-1"><label htmlFor="link-href" className="sr-only">Link address</label>
            <input id="link-href" autoFocus value={href} onChange={(e) => { setHref(e.target.value); setLinkError("") }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyLink() } if (e.key === "Escape") setLinkOpen(false) }} placeholder="/products/air-fryer-5-5l or https://…" aria-invalid={linkError ? true : undefined}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40" />
            {linkError && <p role="alert" className="text-xs text-destructive">{linkError}</p>}</div>
          <button type="button" onClick={applyLink} className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">Apply</button>
          <button type="button" onClick={() => setLinkOpen(false)} className="h-9 rounded-md border px-3 text-sm">Cancel</button>
        </div>
      )}
      <EditorContent editor={editor} />
      <div className="flex justify-between border-t bg-muted/30 px-4 py-2 text-xs text-muted-foreground"><span>{s.words} words · about {Math.max(1, Math.round(s.words / 200))} min read</span><span>Saved as safe structured content, never raw HTML</span></div>
    </div>
  )
}
