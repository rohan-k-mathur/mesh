// lib/tiptap/extensions/text-style-ssr.ts
import { Mark, mergeAttributes } from '@tiptap/core'

function quoteFontList(val?: string | null): string | null {
  if (!val) return null
  return val
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => {
      const bare = s.replace(/^['"]+|['"]+$/g, '')
      return /[^a-zA-Z0-9-]/.test(bare) ? `'${bare}'` : bare
    })
    .join(', ')
}

export const TextStyleSSR = Mark.create({
  name: "textStyle",

  // lean: only render attributes we care about for SSR
  addAttributes() {
    return {
      fontFamily: { default: null },
      fontSize: { default: null },
      color: { default: null },
    }
  },

  // server rendering only
  renderHTML({ HTMLAttributes }) {
    const css: string[] = []
    if (HTMLAttributes.fontFamily)
      css.push(`font-family:${quoteFontList(HTMLAttributes.fontFamily)}`)
    if (HTMLAttributes.fontSize)
      css.push(`font-size:${HTMLAttributes.fontSize}`)
    if (HTMLAttributes.color) css.push(`color:${HTMLAttributes.color}`)

    const style = [css.join("; "), HTMLAttributes.style]
      .filter(Boolean)
      .join("; ")

    const out = mergeAttributes(HTMLAttributes, style ? { style } : {})
    delete (out as any).fontFamily
    delete (out as any).fontSize
    delete (out as any).color

    return ["span", out, 0]
  },
})
