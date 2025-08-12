// lib/tiptap/extensions/text-style-tokens.ts
import { mergeAttributes } from '@tiptap/core'
import TextStyle from '@tiptap/extension-text-style'

const FONT_MAP: Record<string, string> = {
  "'Founders', sans-serif": 'founders',
  "'Bugrino', serif": 'bugrino',
  "'New Edge Test', serif": 'newedge',
  "'Kolonia', serif": 'kolonia',
  inherit: 'system',
}
const SIZE_MAP: Record<string, string> = {
  '12px': '12','14px': '14','16px': '16','18px': '18',
  '20px': '20','24px': '24','32px': '32','48px': '48',
}
const COLOR_MAP: Record<string, string> = {
  '#333333': 'accent',
  '#d52020': 'red',
}

export const TextStyleTokens = TextStyle.extend({
  name: 'textStyle',

  addAttributes() {
    return {
      // New token attributes
      ff:  { default: null }, // 'system' | 'founders' | 'bugrino' | 'newedge' | 'kolonia'
      fs:  { default: null }, // '12' | '14' | ... | '48'
      clr: { default: null }, // 'accent' | 'red' | 'muted' | ...
      // Legacy attrs (kept only to migrate existing content gracefully)
      fontFamily: { default: null },
      fontSize:   { default: null },
      color:      { default: null },
    }
  },
  renderHTML({ HTMLAttributes }) {
    const { ff, fs, clr, ...rest } = HTMLAttributes
    const out:any = { ...rest }
    if (ff)  out['data-ff']  = ff
    if (fs)  out['data-fs']  = fs
    if (clr) out['data-clr'] = clr
    return ['span', out, 0]
  },
//   renderHTML({ mark, HTMLAttributes }) {
//     const a = mark?.attrs ?? {}

//     // Prefer tokens; fall back to legacy → token mapping
//     const ff  = a.ff  ?? FONT_MAP[a.fontFamily as string] ?? null
//     const fs  = a.fs  ?? SIZE_MAP[a.fontSize as string]   ?? null
//     const clr = a.clr ?? COLOR_MAP[a.color as string]     ?? null

//     const out = mergeAttributes(
//       HTMLAttributes,
//       ff  ? { 'data-ff': ff }   : {},
//       fs  ? { 'data-fs': fs }   : {},
//       clr ? { 'data-clr': clr } : {},
//     )

//     // Don’t leak legacy attrs to DOM
//     delete (out as any).fontFamily
//     delete (out as any).fontSize
//     delete (out as any).color

//     return ['span', out, 0]
//   },
})
