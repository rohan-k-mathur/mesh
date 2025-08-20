// components/article/ArticleReader.tsx
'use client'

import clsx from 'clsx'


interface ArticleReaderProps {
  template: string
  heroSrc?: string | null
  children: React.ReactNode
    title?: string                 // ⬅️ new
}



export default function ArticleReader({
  template,
  heroSrc,
  children,
  title,
}: ArticleReaderProps) {
  return (
    <article className={clsx(template, 'mx-auto')}>
        {title && (
        <header className="mb-6">
          <h1 className="text-3xl font-semibold text-center tracking-wide">{title}</h1>
        </header>
      )}
      {heroSrc && (
        <img
          src={heroSrc}
          alt=""
          className="mb-8 w-full rounded-lg object-cover  "
        />
      )}
      {children}
    </article>
  )
}