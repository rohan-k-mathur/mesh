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
  name: 'textStyle',

  // keep this lean; SSR only needs to *render*
  addAttributes() {
    return {
      fontFamily: { default: null },
      fontSize:   { default: null },
      color:      { default: null },
    }
  },

  // (parseHTML not needed for SSR → we aren’t parsing from HTML)

  renderHTML({ mark, HTMLAttributes }) {
    const a = { ...(mark?.attrs ?? {}), ...(HTMLAttributes ?? {}) }

    const css: string[] = []
    if (a.fontFamily) css.push(`font-family:${quoteFontList(a.fontFamily)}`)
    if (a.fontSize)   css.push(`font-size:${a.fontSize}`)
    if (a.color)      css.push(`color:${a.color}`)

    const style = [HTMLAttributes?.style, css.join('; ')].filter(Boolean).join('; ')
    const out = mergeAttributes(HTMLAttributes, style ? { style } : {})

    delete (out as any).fontFamily
    delete (out as any).fontSize
    delete (out as any).color

    return ['span', out, 0]
  },
})
