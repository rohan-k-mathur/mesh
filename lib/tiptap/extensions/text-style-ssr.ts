import { mergeAttributes } from '@tiptap/core'
import TextStyle from '@tiptap/extension-text-style'

// keep quoting helper as you had it
function quoteFontList(val?: string | null): string | null {
  if (!val) return null
  return val.split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => {
      const bare = s.replace(/^['"]+|['"]+$/g, '')
      return /[^a-zA-Z0-9-]/.test(bare) ? `'${bare}'` : bare
    })
    .join(', ')
}

export const TextStyleSSR = TextStyle.extend({
  name: 'textStyle',
  priority: 1000, // ensure we beat anything else

  addAttributes() {
    return {
      fontFamily: { default: null },
      fontSize:   { default: null },
      color:      { default: null },
    }
  },

  renderHTML({ HTMLAttributes }) {
    const { fontFamily, fontSize, color, style, ...rest } = HTMLAttributes
    const css = [
      fontFamily && `font-family:${quoteFontList(fontFamily)}`,
      fontSize   && `font-size:${fontSize}`,
      color      && `color:${color}`,
    ].filter(Boolean).join('; ')

    // TEMP: add a flag so we can see if this renderer is actually used
    const attrs = mergeAttributes(
      rest,
      css || style ? { style: [style, css].filter(Boolean).join('; ') } : {},
      { 'data-ssr-textstyle': '1' } // <-- remove after verifying
    )

    return ['span', attrs, 0]
  },
})
