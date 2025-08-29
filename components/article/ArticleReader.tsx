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
        <header className="mb-4">
          <h1 className="text-3xl font-semibold text-center justify-center items-center mx-auto tracking-wide">{title}</h1>
        </header>
      )}
      <hr className="w-[100%] border-[.5px] border-slate-700/70 justify-center items-center mx-auto mt-4 mb-2"></hr>
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