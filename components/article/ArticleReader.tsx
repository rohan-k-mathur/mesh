// components/article/ArticleReader.tsx
'use client'

import clsx from 'clsx'
import Image from 'next/image'

export interface ArticleReaderProps {
  /** Template slug saved with the article (“standard”, “magazine”, …) */
  template: 'standard' | 'magazine' | 'minimal' | string
  /** Optional hero URL – renders above the article body */
  heroSrc?: string | null
  /** The actual HTML content generated from TipTap JSON */
  children: React.ReactNode
}

export default function ArticleReader({
  template,
  heroSrc,
  children,
}: ArticleReaderProps) {
  /* ----- typographic palettes per template ----------------------------- */
  const articleClass = clsx(
    'prose prose-slate max-w-3xl mx-auto px-4 pb-16',
    'prose-headings:scroll-mt-24',               // smooth anchor linking
    'dark:prose-invert',                         // dark‑mode friendly
    {
      /* ‑‑ “standard” = default serif headings, comfortable line‑height */
      standard:
        template === 'standard' &&
        'prose-h1:font-serif prose-h1:text-4xl prose-p:text-base',
      /* ‑‑ “magazine” = wide text, big drop caps, larger imgs */
      magazine:
        template === 'magazine' &&
        'max-w-4xl prose-h1:text-5xl first-letter:text-6xl first-letter:font-serif',
      /* ‑‑ “minimal” = sans headings, tight spacing */
      minimal:
        template === 'minimal' &&
        'prose-h1:font-sans prose-p:leading-relaxed prose-ul:pl-5',
    }[template] /* just to satisfy TS */ || ''
  )

  return (
    <>
      {/* ------ hero banner (optional) ------------------------------------ */}
      {heroSrc && (
        <div className="relative w-full h-60 md:h-96">
          <Image
            src={heroSrc}
            alt=""
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
        </div>
      )}

      {/* ------ article body --------------------------------------------- */}
      <article className={articleClass}>{children}</article>
    </>
  )
}
