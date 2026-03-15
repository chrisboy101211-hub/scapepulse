import { useRef, useState, useEffect, useCallback } from "react"

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}

const FONT_SIZES = ["10", "12", "14", "16", "18", "20", "24", "28", "32", "36", "48"]

const EMOJIS = [
  "⚔️","🛡️","🏹","🗡️","🔮","💎","👑","🐉","🧙","🏆",
  "⭐","🌟","💫","🔥","❄️","⚡","🌊","🍀","💀","👹",
  "😀","😎","😍","🤩","😤","💪","🎯","🎮","🎲","🎁",
  "✅","❌","⚠️","📢","💬","📜","🗺️","🏰","⚒️","🧪",
]

// ── Toolbar Button ────────────────────────────────────────────────────────────
function Btn({ title, active, onClick, children }: {
  title: string; active?: boolean; onClick: () => void; children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      className={`w-8 h-8 flex items-center justify-center rounded text-sm transition-colors
        ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
    >
      {children}
    </button>
  )
}

// ── Toolbar Separator ─────────────────────────────────────────────────────────
const Sep = () => <div className="w-px h-6 bg-border mx-0.5 self-center" />

export function RichTextEditor({ value, onChange, placeholder = "Write your description…", minHeight = 280 }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const colorRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [showLink, setShowLink] = useState(false)
  const [showImage, setShowImage] = useState(false)
  const [showCodeBlock, setShowCodeBlock] = useState(false)
  const [codeBlockLang, setCodeBlockLang] = useState("javascript")
  const [codeBlockContent, setCodeBlockContent] = useState("")
  const [linkUrl, setLinkUrl] = useState("https://")
  const [imageUrl, setImageUrl] = useState("https://")
  const [currentColor, setCurrentColor] = useState("#ffffff")
  const [currentSize, setCurrentSize] = useState("14")
  const savedSelection = useRef<Range | null>(null)

  // Init editor with value once
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const sync = useCallback(() => {
    if (editorRef.current) onChange(editorRef.current.innerHTML)
  }, [onChange])

  const exec = (cmd: string, val?: string) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, val ?? undefined)
    sync()
  }

  const saveSelection = () => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) savedSelection.current = sel.getRangeAt(0).cloneRange()
  }

  const restoreSelection = () => {
    const sel = window.getSelection()
    if (sel && savedSelection.current) {
      sel.removeAllRanges()
      sel.addRange(savedSelection.current)
    }
    editorRef.current?.focus()
  }

  const insertLink = () => {
    restoreSelection()
    if (linkUrl.trim() && linkUrl !== "https://") {
      exec("createLink", linkUrl.trim())
    }
    setShowLink(false)
    setLinkUrl("https://")
  }

  const insertImage = () => {
    restoreSelection()
    if (imageUrl.trim() && imageUrl !== "https://") {
      exec("insertImage", imageUrl.trim())
    }
    setShowImage(false)
    setImageUrl("https://")
  }

  const insertEmoji = (emoji: string) => {
    editorRef.current?.focus()
    document.execCommand("insertText", false, emoji)
    sync()
    setShowEmoji(false)
  }

  const applySize = (size: string) => {
    setCurrentSize(size)
    restoreSelection()
    // Wrap in a span with explicit font-size
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0)
      const span = document.createElement("span")
      span.style.fontSize = `${size}px`
      range.surroundContents(span)
      sel.removeAllRanges()
      sync()
    }
    editorRef.current?.focus()
  }

  const applyColor = (color: string) => {
    setCurrentColor(color)
    restoreSelection()
    exec("foreColor", color)
  }

  const queryCmd = (cmd: string) => {
    try { return document.queryCommandState(cmd) } catch { return false }
  }

  const toolbarGroups = [
    // Formatting
    [
      <Btn key="bold"   title="Bold"          active={queryCmd("bold")}          onClick={() => exec("bold")}>          <strong>B</strong> </Btn>,
      <Btn key="italic" title="Italic"        active={queryCmd("italic")}        onClick={() => exec("italic")}>        <em>I</em>          </Btn>,
      <Btn key="under"  title="Underline"     active={queryCmd("underline")}     onClick={() => exec("underline")}>     <u>U</u>            </Btn>,
      <Btn key="strike" title="Strikethrough" active={queryCmd("strikeThrough")} onClick={() => exec("strikeThrough")}> <s>S</s>            </Btn>,
    ],
    // Blocks
    [
      <Btn key="link" title="Insert Link" onClick={() => { saveSelection(); setShowLink(true) }}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
      </Btn>,
      <Btn key="quote" title="Blockquote" active={queryCmd("formatBlock")} onClick={() => exec("formatBlock", "<blockquote>")}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
      </Btn>,
      <Btn key="code-inline" title="Inline Code" onClick={() => {
        const sel = window.getSelection()
        if (sel && !sel.isCollapsed) {
          const range = sel.getRangeAt(0)
          const code = document.createElement("code")
          code.style.cssText = "background:rgba(255,255,255,0.1);padding:1px 6px;border-radius:3px;font-family:monospace;font-size:0.88em;color:#e2e8f0"
          range.surroundContents(code)
          sync()
        }
      }}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
      </Btn>,
      <Btn key="code-block" title="Code Block (Discord style)" onClick={() => { saveSelection(); setShowCodeBlock((v) => !v) }}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 5a1 1 0 000 2h1v10H4a1 1 0 000 2h16a1 1 0 000-2h-1V7h1a1 1 0 000-2H4zm3 2h10v10H7V7zm2 2v6h6V9H9z"/></svg>
      </Btn>,
      <div key="emoji" className="relative">
        <Btn title="Emoji" onClick={() => { saveSelection(); setShowEmoji((v) => !v) }}>😊</Btn>
        {showEmoji && (
          <div className="absolute top-9 left-0 z-50 bg-card border border-border rounded-xl shadow-2xl p-3 w-64">
            <div className="grid grid-cols-10 gap-1">
              {EMOJIS.map((e) => (
                <button key={e} type="button" onMouseDown={(ev) => { ev.preventDefault(); insertEmoji(e) }}
                  className="w-6 h-6 flex items-center justify-center text-base hover:bg-secondary rounded transition-colors">
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>,
    ],
    // Lists
    [
      <Btn key="ul" title="Bullet List"   active={queryCmd("insertUnorderedList")} onClick={() => exec("insertUnorderedList")}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
      </Btn>,
      <Btn key="ol" title="Numbered List" active={queryCmd("insertOrderedList")}   onClick={() => exec("insertOrderedList")}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M2 5h2v.5H3v1h1V7H2v1h3V4H2v1zm1 9H2v1h3v-4H2v1h2v.5H3v1h1V14zm-1 4v1h3v-1H4v-.5h1v-1H4V16H2v1h1v.5H2zM8 7h14v2H8V7zm0 6h14v2H8v-2zm0 6h14v2H8v-2z"/></svg>
      </Btn>,
    ],
    // Alignment
    [
      <Btn key="al" title="Align Left"   active={queryCmd("justifyLeft")}   onClick={() => exec("justifyLeft")}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h18v2H3V3zm0 4h12v2H3V7zm0 4h18v2H3v-2zm0 4h12v2H3v-2zm0 4h18v2H3v-2z"/></svg>
      </Btn>,
      <Btn key="ac" title="Align Center" active={queryCmd("justifyCenter")} onClick={() => exec("justifyCenter")}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h18v2H3V3zm3 4h12v2H6V7zm-3 4h18v2H3v-2zm3 4h12v2H6v-2zm-3 4h18v2H3v-2z"/></svg>
      </Btn>,
      <Btn key="ar" title="Align Right"  active={queryCmd("justifyRight")}  onClick={() => exec("justifyRight")}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h18v2H3V3zm6 4h12v2H9V7zm-6 4h18v2H3v-2zm6 4h12v2H9v-2zm-6 4h18v2H3v-2z"/></svg>
      </Btn>,
    ],
    // Color, Size, Image
    [
      // Text color
      <div key="color" className="relative">
        <button type="button" title="Text Color"
          onMouseDown={(e) => { e.preventDefault(); saveSelection(); colorRef.current?.click() }}
          className="w-8 h-8 flex flex-col items-center justify-center rounded hover:bg-secondary transition-colors gap-0.5">
          <span className="text-xs font-bold text-foreground leading-none">A</span>
          <div className="w-5 h-1 rounded-sm" style={{ backgroundColor: currentColor }} />
        </button>
        <input ref={colorRef} type="color" value={currentColor} onChange={(e) => applyColor(e.target.value)}
          className="absolute opacity-0 w-0 h-0 pointer-events-none" />
      </div>,
      // Font size
      <div key="size" className="relative">
        <select
          value={currentSize}
          onMouseDown={saveSelection}
          onChange={(e) => applySize(e.target.value)}
          className="h-8 px-1.5 text-xs bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
        >
          {FONT_SIZES.map((s) => <option key={s} value={s}>{s}px</option>)}
        </select>
      </div>,
      // Insert image
      <Btn key="img" title="Insert Image" onClick={() => { saveSelection(); setShowImage(true) }}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
        </svg>
      </Btn>,
    ],
    // Preview
    [
      <Btn key="preview" title={preview ? "Edit" : "Preview"} active={preview} onClick={() => setPreview((v) => !v)}>
        {preview
          ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
        }
      </Btn>,
    ],
  ]

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary transition-colors">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-card/50">
        {toolbarGroups.map((group, gi) => (
          <div key={gi} className="flex items-center gap-0.5">
            {gi > 0 && <Sep />}
            {group}
          </div>
        ))}
      </div>

      {/* Editor / Preview */}
      {preview ? (
        <div
          className="px-4 py-3 prose prose-invert max-w-none min-h-[var(--mh)] text-sm text-foreground"
          style={{ "--mh": `${minHeight}px` } as React.CSSProperties}
          dangerouslySetInnerHTML={{ __html: value || `<span class="text-muted-foreground">${placeholder}</span>` }}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={sync}
          onKeyUp={sync}
          data-placeholder={placeholder}
          className="px-4 py-3 text-sm text-foreground outline-none overflow-y-auto
            [&_blockquote]:border-l-4 [&_blockquote]:border-primary/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-2
            [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-xs
            [&_a]:text-primary [&_a]:underline
            [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
            [&_img]:max-w-full [&_img]:rounded [&_img]:my-2
            empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none"
          style={{ minHeight: `${minHeight}px` }}
        />
      )}

      {/* Link dialog */}
      {showLink && (
        <div className="border-t border-border px-4 py-3 bg-card/50 flex items-center gap-3">
          <span className="text-xs text-muted-foreground flex-shrink-0">URL:</span>
          <input
            autoFocus value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") insertLink(); if (e.key === "Escape") setShowLink(false) }}
            className="flex-1 px-3 py-1.5 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button type="button" onClick={insertLink}
            className="px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded font-medium hover:bg-primary/90 transition-colors">
            Insert
          </button>
          <button type="button" onClick={() => setShowLink(false)}
            className="px-3 py-1.5 border border-border text-xs rounded text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
        </div>
      )}

      {/* Image dialog */}
      {showImage && (
        <div className="border-t border-border px-4 py-3 bg-card/50 flex items-center gap-3">
          <span className="text-xs text-muted-foreground flex-shrink-0">Image URL:</span>
          <input
            autoFocus value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") insertImage(); if (e.key === "Escape") setShowImage(false) }}
            placeholder="https://example.com/image.png"
            className="flex-1 px-3 py-1.5 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button type="button" onClick={insertImage}
            className="px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded font-medium hover:bg-primary/90 transition-colors">
            Insert
          </button>
          <button type="button" onClick={() => setShowImage(false)}
            className="px-3 py-1.5 border border-border text-xs rounded text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
        </div>
      )}

      {/* Code block dialog — Discord style ``` fenced block */}
      {showCodeBlock && (
        <div className="border-t border-border bg-card/50">
          <div className="flex items-center gap-3 px-4 pt-3 pb-2">
            <span className="text-xs font-semibold text-muted-foreground flex-shrink-0">Code Block</span>
            <select
              value={codeBlockLang}
              onChange={(e) => setCodeBlockLang(e.target.value)}
              className="px-2 py-1 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {["javascript","typescript","java","python","php","html","css","sql","bash","json","xml","cpp","csharp","go","rust","plaintext"].map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <div className="flex gap-2 ml-auto">
              <button type="button"
                onClick={() => {
                  restoreSelection()
                  if (!codeBlockContent.trim()) { setShowCodeBlock(false); return }
                  // Build Discord-style fenced code block rendered as pre>code
                  const pre = document.createElement("pre")
                  pre.style.cssText = "background:#1e1e2e;border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:12px 16px;margin:8px 0;overflow-x:auto;font-family:'Courier New',monospace;font-size:0.85em;line-height:1.6;color:#cdd6f4"
                  const code = document.createElement("code")
                  code.setAttribute("data-lang", codeBlockLang)
                  code.style.cssText = "color:inherit;white-space:pre"
                  // Add lang label
                  const label = document.createElement("div")
                  label.style.cssText = "font-size:0.7em;color:rgba(255,255,255,0.4);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em"
                  label.textContent = codeBlockLang
                  code.textContent = codeBlockContent
                  pre.appendChild(label)
                  pre.appendChild(code)
                  editorRef.current?.focus()
                  const sel = window.getSelection()
                  if (sel && savedSelection.current) {
                    sel.removeAllRanges()
                    sel.addRange(savedSelection.current)
                  }
                  document.execCommand("insertHTML", false, pre.outerHTML + "<br>")
                  sync()
                  setShowCodeBlock(false)
                  setCodeBlockContent("")
                }}
                className="px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded font-medium hover:bg-primary/90 transition-colors">
                Insert
              </button>
              <button type="button" onClick={() => { setShowCodeBlock(false); setCodeBlockContent("") }}
                className="px-3 py-1.5 border border-border text-xs rounded text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
            </div>
          </div>
          <div className="px-4 pb-3">
            <textarea
              autoFocus
              value={codeBlockContent}
              onChange={(e) => setCodeBlockContent(e.target.value)}
              rows={6}
              placeholder={`Paste your ${codeBlockLang} code here…`}
              className="w-full px-3 py-2 bg-[#1e1e2e] border border-white/10 rounded font-mono text-xs text-[#cdd6f4] focus:outline-none focus:ring-1 focus:ring-primary resize-y placeholder:text-white/25"
            />
          </div>
        </div>
      )}
    </div>
  )
}
