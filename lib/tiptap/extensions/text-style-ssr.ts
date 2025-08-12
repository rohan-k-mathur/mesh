import TextStyle from '@tiptap/extension-text-style'

// makes font lists safe and consistently single‑quoted
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

export const TextStyleSSR = TextStyle.extend({
  name: 'textStyle',

  addAttributes() {
    return {
      fontFamily: { default: null },
      fontSize:   { default: null },
      color:      { default: null },
    }
  },

  renderHTML({ HTMLAttributes }) {
    const { fontFamily, fontSize, color, style, ...rest } = HTMLAttributes
    const css: string[] = []
    const ff = quoteFontList(fontFamily)

    if (ff)       css.push(`font-family:${ff}`)
    if (fontSize) css.push(`font-size:${fontSize}`)
    if (color)    css.push(`color:${color}`)
    if (style)    css.push(style)

    return ['span', { ...rest, ...(css.length ? { style: css.join('; ') } : {}) }, 0]
  },
})
